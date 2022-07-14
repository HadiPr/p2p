import { useEffect, useMemo, useRef, useState } from 'react';
import './App.scss';

const servers = {
  iceServers: [
    {
      urls: ['stun:stun1.1.google.com:19302', 'stun:stun2.1.google.com:19302'],
    },
  ],
};

function App() {
  const [offer, setOffer] = useState('');
  const [answer, setAnswer] = useState('');
  const peerConnection = useRef(new RTCPeerConnection(servers));
  const localStream = useRef();
  const remoteStream = useRef();
  const userVideo = useRef();
  const peerVideo = useRef();
  const pc = useMemo(() => peerConnection.current, [peerConnection.current]);

  useEffect(() => {
    (async function () {
      //setup user video
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      localStream.current = stream;
      userVideo.current.srcObject = stream;
      remoteStream.current = new MediaStream();
      peerVideo.current.srcObject = remoteStream.current;
      localStream.current
        .getTracks()
        .forEach(t => pc.addTrack(t, localStream.current));

      pc.ontrack = async e =>
        e.streams[0].getTracks().forEach(t => remoteStream.current.addTrack(t));

      pc.onicecandidate = async e => {
        if (e.candidate) {
          pc.localDescription.type === 'offer' &&
            setOffer(JSON.stringify(pc.localDescription));
          pc.localDescription.type === 'answer' &&
            setAnswer(JSON.stringify(pc.localDescription));
        }
      };
    })();
  }, []);

  const handleCreateOffer = async function () {
    const offer = await pc.createOffer();
    pc.setLocalDescription(offer);
    setOffer(JSON.stringify(offer));
  };

  const handleCreateAnswer = async function () {
    const _offer = JSON.parse(offer);
    await pc.setRemoteDescription(_offer);
    const answer = await pc.createAnswer(_offer);
    await pc.setLocalDescription(answer);
    setAnswer(JSON.stringify(answer));
  };

  const handleSetAnswer = function () {
    pc.setRemoteDescription(JSON.parse(answer));
  };

  return (
    <div className='mx-20 p-5  bg-gray-200'>
      <div className='flex flex-col sm:flex-row gap-2 justify-around bg-gray 200'>
        <video autoPlay ref={userVideo} className='w-52' />
        <video autoPlay ref={peerVideo} className='w-52' />
      </div>
      <div>
        <div className='flex items-center my-2 gap-10'>
          <button
            onClick={handleCreateOffer}
            className='bg-purple-600 rounded px-3 py-2'>
            Create Offer
          </button>
          <h2 className='font-bold text-lg'>SDP Offer:</h2>
        </div>
        <textarea
          onChange={e => setOffer(e.target.value)}
          value={offer}
          className='p-2 block w-full h-32'></textarea>
      </div>
      <div>
        <div className='flex items-center my-2 gap-10'>
          <button
            onClick={handleCreateAnswer}
            className='bg-purple-600 rounded px-3 py-2'>
            Create Answer
          </button>{' '}
          <h2 className='font-bold text-lg'>SDP Answer:</h2>
        </div>
        <textarea
          value={answer}
          onChange={e => setAnswer(e.target.value)}
          className='p-2 block w-full h-32'></textarea>
        <button
          onClick={handleSetAnswer}
          className='bg-purple-600 rounded px-3 py-2'>
          Create Answer
        </button>{' '}
      </div>
    </div>
  );
}

export default App;
