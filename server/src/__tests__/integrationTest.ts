import { io } from 'socket.io-client';

async function testScenario() {
  console.log('--- 🧪 STARTING CINEMATE AUTOMATED E2E SOCKET INTEGRATION TEST ---');
  
  const serverUrl = 'http://localhost:5000';
  const socketA = io(serverUrl);
  const socketB = io(serverUrl);

  const waitForConnect = (s: any, name: string) =>
    new Promise((resolve) => s.on('connect', () => {
      console.log(`✅ ${name} connected with socket id: ${s.id}`);
      resolve(true);
    }));

  await Promise.all([waitForConnect(socketA, 'User A (Alice)'), waitForConnect(socketB, 'User B (Bob)')]);

  // 1. User A creates room
  console.log('Step 1: Alice creates room...');
  const createRes: any = await new Promise((resolve) => {
    socketA.emit('room:create', { displayName: 'Alice', participantId: 'user_alice_1' }, resolve);
  });
  console.log('Room created response:', createRes);
  if (!createRes.success) throw new Error('Create room failed');
  const roomId = createRes.room.roomId;

  // 2. User B joins room
  console.log(`Step 2: Bob joins room ${roomId}...`);
  const joinRes: any = await new Promise((resolve) => {
    socketB.emit('room:join', { roomId, displayName: 'Bob', participantId: 'user_bob_2' }, resolve);
  });
  console.log('Bob join response:', joinRes);
  if (!joinRes.success) throw new Error('Bob join failed');

  // 3. User C tries to join (should fail due to 2 person limit)
  console.log(`Step 3: Charlie tries to join full room ${roomId}...`);
  const socketC = io(serverUrl);
  await waitForConnect(socketC, 'User C (Charlie)');
  const joinFullRes: any = await new Promise((resolve) => {
    socketC.emit('room:join', { roomId, displayName: 'Charlie', participantId: 'user_charlie_3' }, resolve);
  });
  console.log('Charlie join (expecting full error):', joinFullRes);
  if (joinFullRes.success) throw new Error('Expected room full error but succeeded');
  console.log('✅ Room capacity limit correctly enforced!');
  socketC.disconnect();

  // 4. User A loads video
  console.log('Step 4: Alice loads video...');
  const mediaLoadPromise = new Promise((resolve) => {
    socketB.on('media:loaded', (data) => {
      console.log('✅ Bob received media:loaded event:', data.mediaUrl);
      resolve(data);
    });
  });

  socketA.emit('media:load', {
    roomId,
    mediaUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    mediaProvider: 'html5'
  });
  await mediaLoadPromise;

  // 5. User A presses Play -> User B synchronizes
  console.log('Step 5: Alice presses Play...');
  const playPromise = new Promise((resolve) => {
    socketB.on('playback:sync', (data) => {
      console.log('✅ Bob received playback:sync event:', data.action, 'at time:', data.currentTime);
      resolve(data);
    });
  });

  socketA.emit('playback:action', {
    roomId,
    action: 'play',
    currentTime: 12.4,
    playbackRate: 1,
    timestamp: Date.now(),
    senderId: 'user_alice_1',
    sequenceNumber: 1
  });
  await playPromise;

  // 6. User B sends chat message -> User A receives it
  console.log('Step 6: Bob sends chat message...');
  const chatPromise = new Promise((resolve) => {
    socketA.on('chat:message', (msg) => {
      console.log(`✅ Alice received chat from ${msg.senderName}: "${msg.text}"`);
      resolve(msg);
    });
  });

  socketB.emit('chat:send', {
    roomId,
    text: 'Hey Alice! Video looks super crisp! 🍿'
  });
  await chatPromise;

  // 7. WebRTC signaling test
  console.log('Step 7: WebRTC signaling exchange...');
  const webrtcOfferPromise = new Promise((resolve) => {
    socketB.on('webrtc:offer', (data) => {
      console.log('✅ Bob received WebRTC offer from Alice:', data.senderSocketId);
      resolve(data);
    });
  });

  socketA.emit('webrtc:offer', {
    roomId,
    offer: { type: 'offer', sdp: 'fake-sdp-test' }
  });
  await webrtcOfferPromise;

  console.log('🎉 ALL INTEGRATION FLOWS VERIFIED SUCCESSFULLY!');
  socketA.disconnect();
  socketB.disconnect();
  process.exit(0);
}

testScenario().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});

