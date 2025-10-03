import { io, Socket } from 'socket.io-client';
import { store } from '../store';
import { addMessage } from '../store/slices/messagesSlice';
import { setActiveCall, updateCallStatus } from '../store/slices/callsSlice';
import { Message, Call } from '../types';

class SocketService {
  private socket: Socket | null = null;
  private readonly SERVER_URL = 'https://xqijgdbxjolgdujeplyi.supabase.co';

  connect(userId: string) {
    if (this.socket?.connected) {
      return;
    }

    this.socket = io(this.SERVER_URL, {
      auth: {
        userId,
      },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.setupEventListeners();
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket?.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    // Message events
    this.socket.on('new_message', (message: Message) => {
      store.dispatch(addMessage(message));
    });

    // Call events
    this.socket.on('incoming_call', (call: Call) => {
      store.dispatch(setActiveCall(call));
    });

    this.socket.on('call_accepted', (callId: string) => {
      store.dispatch(updateCallStatus({ callId, status: 'active' }));
    });

    this.socket.on('call_rejected', (callId: string) => {
      store.dispatch(updateCallStatus({ callId, status: 'ended' }));
    });

    this.socket.on('call_ended', (callId: string) => {
      store.dispatch(updateCallStatus({ callId, status: 'ended' }));
    });

    // WebRTC signaling events
    this.socket.on('webrtc_offer', this.handleWebRTCOffer.bind(this));
    this.socket.on('webrtc_answer', this.handleWebRTCAnswer.bind(this));
    this.socket.on('webrtc_ice_candidate', this.handleICECandidate.bind(this));
  }

  private handleWebRTCOffer(data: { from: string; offer: RTCSessionDescriptionInit }) {
    console.log('Received WebRTC offer from:', data.from);
    // This will be handled by the WebRTC service
  }

  private handleWebRTCAnswer(data: { from: string; answer: RTCSessionDescriptionInit }) {
    console.log('Received WebRTC answer from:', data.from);
    // This will be handled by the WebRTC service
  }

  private handleICECandidate(data: { from: string; candidate: RTCIceCandidateInit }) {
    console.log('Received ICE candidate from:', data.from);
    // This will be handled by the WebRTC service
  }

  // Emit events
  sendMessage(message: Omit<Message, 'id' | 'createdAt' | 'updatedAt'>) {
    this.socket?.emit('send_message', message);
  }

  joinChat(chatId: string) {
    this.socket?.emit('join_chat', chatId);
  }

  leaveChat(chatId: string) {
    this.socket?.emit('leave_chat', chatId);
  }

  initiateCall(call: Partial<Call>) {
    this.socket?.emit('initiate_call', call);
  }

  acceptCall(callId: string) {
    this.socket?.emit('accept_call', callId);
  }

  rejectCall(callId: string) {
    this.socket?.emit('reject_call', callId);
  }

  endCall(callId: string) {
    this.socket?.emit('end_call', callId);
  }

  // WebRTC signaling
  sendWebRTCOffer(to: string, offer: RTCSessionDescriptionInit) {
    this.socket?.emit('webrtc_offer', { to, offer });
  }

  sendWebRTCAnswer(to: string, answer: RTCSessionDescriptionInit) {
    this.socket?.emit('webrtc_answer', { to, answer });
  }

  sendICECandidate(to: string, candidate: RTCIceCandidateInit) {
    this.socket?.emit('webrtc_ice_candidate', { to, candidate });
  }

  // Typing indicators
  startTyping(chatId: string) {
    this.socket?.emit('typing_start', chatId);
  }

  stopTyping(chatId: string) {
    this.socket?.emit('typing_stop', chatId);
  }

  // User status
  updateOnlineStatus(isOnline: boolean) {
    this.socket?.emit('update_status', { isOnline });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  on(event: string, callback: (...args: any[]) => void) {
    this.socket?.on(event, callback);
  }

  off(event: string, callback?: (...args: any[]) => void) {
    this.socket?.off(event, callback);
  }
}

export default new SocketService();
