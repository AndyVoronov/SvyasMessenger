import {
  RTCPeerConnection,
  RTCSessionDescription,
  RTCIceCandidate,
  mediaDevices,
  MediaStream,
} from 'react-native-webrtc';

const STUN_SERVER = 'stun:stun.l.google.com:19302';

interface WebRTCConfig {
  iceServers: Array<{
    urls: string;
    username?: string;
    credential?: string;
  }>;
}

const config: WebRTCConfig = {
  iceServers: [
    {
      urls: STUN_SERVER,
    },
  ],
};

export class WebRTCService {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;

  async initialize(isVideo: boolean = false) {
    try {
      // Get user media
      const stream = await mediaDevices.getUserMedia({
        audio: true,
        video: isVideo
          ? {
              facingMode: 'user',
              width: { ideal: 1280 },
              height: { ideal: 720 },
            }
          : false,
      });

      this.localStream = stream;

      // Create peer connection
      this.peerConnection = new RTCPeerConnection(config);

      // Add local stream tracks to peer connection
      stream.getTracks().forEach((track) => {
        if (this.peerConnection && this.localStream) {
          this.peerConnection.addTrack(track, this.localStream);
        }
      });

      return stream;
    } catch (error) {
      console.error('Error initializing WebRTC:', error);
      throw error;
    }
  }

  async createOffer() {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }

    try {
      const offer = await this.peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });

      await this.peerConnection.setLocalDescription(offer);
      return offer;
    } catch (error) {
      console.error('Error creating offer:', error);
      throw error;
    }
  }

  async createAnswer() {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }

    try {
      const answer = await this.peerConnection.createAnswer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });

      await this.peerConnection.setLocalDescription(answer);
      return answer;
    } catch (error) {
      console.error('Error creating answer:', error);
      throw error;
    }
  }

  async setRemoteDescription(description: RTCSessionDescription) {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }

    try {
      await this.peerConnection.setRemoteDescription(
        new RTCSessionDescription(description)
      );
    } catch (error) {
      console.error('Error setting remote description:', error);
      throw error;
    }
  }

  async addIceCandidate(candidate: RTCIceCandidate) {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }

    try {
      await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (error) {
      console.error('Error adding ICE candidate:', error);
      throw error;
    }
  }

  onIceCandidate(callback: (candidate: RTCIceCandidate) => void) {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }

    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        callback(event.candidate);
      }
    };
  }

  onTrack(callback: (stream: MediaStream) => void) {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }

    this.peerConnection.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        this.remoteStream = event.streams[0];
        callback(event.streams[0]);
      }
    };
  }

  toggleAudio(enabled: boolean) {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((track) => {
        track.enabled = enabled;
      });
    }
  }

  toggleVideo(enabled: boolean) {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach((track) => {
        track.enabled = enabled;
      });
    }
  }

  switchCamera() {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach((track) => {
        // @ts-ignore
        track._switchCamera();
      });
    }
  }

  cleanup() {
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }

    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    this.remoteStream = null;
  }

  getLocalStream() {
    return this.localStream;
  }

  getRemoteStream() {
    return this.remoteStream;
  }

  getConnectionState() {
    return this.peerConnection?.connectionState;
  }
}

export default new WebRTCService();
