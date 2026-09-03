import {
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UsersService } from '../users/users.service';
import { AiService } from '../ai/ai.service';
import { Logger } from '@nestjs/common';

// Role that is handled by Gemini AI instead of the static reply map
const AI_POWERED_ROLE = 'Lead Developer';

@WebSocketGateway({
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'],
    credentials: true,
  },
})
export class WebsocketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(WebsocketGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(
    private readonly usersService: UsersService,
    private readonly aiService: AiService,
  ) {}

  afterInit() {
    this.logger.log('WebSocket Gateway Initialized');

    // Periodically change a random user's status and broadcast it
    setInterval(async () => {
      try {
        const users = await this.usersService.findAll();
        if (users.length === 0) return;

        const randomUser = users[Math.floor(Math.random() * users.length)];
        const statuses: ('Active' | 'Inactive' | 'Pending')[] = [
          'Active',
          'Inactive',
          'Pending',
        ];
        // Filter out the current status so it actually changes
        const availableStatuses = statuses.filter((s) => s !== randomUser.status);
        const newStatus =
          availableStatuses[Math.floor(Math.random() * availableStatuses.length)];

        await this.usersService.updateUserStatus(randomUser.id, newStatus);
        this.logger.log(
          `Broadcasting status update: ${randomUser.name} is now ${newStatus}`,
        );

        this.server.emit('user_status_update', {
          userId: randomUser.id,
          status: newStatus,
        });
      } catch (error) {
        this.logger.error('Error executing status update broadcast', error);
      }
    }, 15000); // every 15 seconds
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(
    client: Socket,
    payload: { senderId: string; receiverId: string; text: string },
  ): Promise<void> {
    this.logger.log(
      `Message received from ${payload.senderId} to ${payload.receiverId}: ${payload.text}`,
    );

    // Echo the client's message back to them to acknowledge receipt and populate UI
    client.emit('receive_message', {
      senderId: payload.senderId,
      receiverId: payload.receiverId,
      text: payload.text,
      timestamp: new Date().toISOString(),
    });

    const receiverId = payload.receiverId;
    const receiver = await this.usersService.findById(receiverId);

    if (!receiver) return;

    const isAiPowered = receiver.role === AI_POWERED_ROLE;

    // Show typing indicator after a short natural delay
    setTimeout(() => {
      client.emit('typing', { userId: receiverId, isTyping: true });
    }, 1000);

    if (isAiPowered) {
      // ── Gemini AI path (Lead Developer) ────────────────────────────────────
      this.logger.log(
        `Routing message to Gemini AI for ${receiver.name} (${receiver.role})`,
      );

      // Build a role-aware system prompt so Gemini stays in character
      const prompt =
        `You are ${receiver.name}, a ${receiver.role} at a software company. ` +
        `Respond helpfully, concisely, and in-character as a ${receiver.role}. ` +
        `Keep replies under 3 sentences. ` +
        `The user says: "${payload.text}"`;

      try {
        const aiReply = await this.aiService.generateResponse(prompt);

        // Stop typing indicator and send the AI reply
        client.emit('typing', { userId: receiverId, isTyping: false });
        client.emit('receive_message', {
          senderId: receiverId,
          receiverId: payload.senderId,
          text: aiReply,
          timestamp: new Date().toISOString(),
        });

        this.logger.log(`Gemini reply sent to client for ${receiver.name}.`);
      } catch (error) {
        this.logger.error(
          `Gemini API error for ${receiver.name} (${receiver.role}):`,
          error,
        );

        // Stop typing and emit a graceful fallback — never crash the socket
        client.emit('typing', { userId: receiverId, isTyping: false });
        client.emit('receive_message', {
          senderId: receiverId,
          receiverId: payload.senderId,
          text: `Sorry, I'm having trouble connecting right now. Give me a moment and try again!`,
          timestamp: new Date().toISOString(),
        });
      }
    } else {
      // ── Static reply path (all other roles) ────────────────────────────────
      setTimeout(() => {
        client.emit('typing', { userId: receiverId, isTyping: false });

        const replyText = this.getSimulatedReply(receiver.name, receiver.role);
        client.emit('receive_message', {
          senderId: receiverId,
          receiverId: payload.senderId,
          text: replyText,
          timestamp: new Date().toISOString(),
        });
      }, 2000);
    }
  }

  private getSimulatedReply(name: string, role: string): string {
    const replies: Record<string, string> = {
      'Product Designer': `Hey! Working on the new Figma mockups right now. The style guide updates look promising. I'll review your design feedback shortly!`,
      'Lead Developer': `Hey! Just wrapping up some code reviews and merged a PR. What's on your mind? Let me know if we need to schedule a pairing session.`,
      'Product Manager': `Hi! In an alignment meeting with stakeholders right now. Can we connect in about 30 minutes? Feel free to drop the details here.`,
      'DevOps Engineer': `Hey there. Checking the CI/CD pipeline logs since a build failed a moment ago. Let me finish this deploy and I'll take a look!`,
      'QA Specialist': `Hey! I'm running some test automation suites on the staging build. Give me a few minutes to check the reports and I'll ping you.`,
      'Support Engineer': `Hello. Handling some urgent client tickets and checkups. What can I help you with?`,
      'Data Scientist': `Hey! I'm running a data training script on our user engagement dataset. The accuracy metrics look good! Let's discuss this soon.`,
      'Security Engineer': `Hi. Doing a code audit on the authentication endpoints. Is there something security-related we need to patch? Let me know.`,
    };

    return (
      replies[role] ||
      `Hey! Thanks for messaging. I am currently offline or busy, but I'll get back to you as soon as I can!`
    );
  }
}

