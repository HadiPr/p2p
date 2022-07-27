import { useEffect, useMemo, useRef, useState } from 'react';
import './App.scss';
import { io } from 'socket.io-client';
const servers = {
  iceServers: [
    {
      urls: ['stun:stun1.1.google.com:19302', 'stun:stun2.1.google.com:19302'],
    },
  ],
};
function App() {
  const [state, setState] = useState('NEUTRAL'); // NEUTRAL | CALLING | WAITIN_TO_ANSWER | CONNECTED | ERROR
  const peerConnection = useRef(new RTCPeerConnection(servers));
  const offer = useRef();
  const localStream = useRef();
  const remoteStream = useRef();
  const userVideo = useRef();
  const peerVideo = useRef();
  const pc = useMemo(() => peerConnection.current, [peerConnection.current]);
  const _io = useRef();

  useEffect(() => {
    (async function () {
      // setup user video
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        localStream.current = stream;
        userVideo.current.srcObject = stream;
      } catch (error) {
        setState('ERROR');
      }
      // setup peer video
      remoteStream.current = new MediaStream();
      peerVideo.current.srcObject = remoteStream.current;
      localStream.current
        .getTracks()
        .forEach(t => pc.addTrack(t, localStream.current));

      pc.ontrack = async e =>
        e.streams[0].getTracks().forEach(t => remoteStream.current.addTrack(t));

      pc.onicecandidate = async e => {
        if (e.candidate) {
          if (pc.localDescription.type === 'offer') {
            _io.current.emit('offer', pc.localDescription);
          }
          if (pc.localDescription.type === 'answer') {
            _io.current.emit('answer', pc.localDescription);
            setState('CONNECTED');
          }
        }
      };
    })();

    // connect and setup ws
    _io.current = io('/', { transports: ['websocket'] });
    _io.current.connect();

    _io.current.on('offer', _offer => {
      setState('WAITIN_TO_ANSWER');
      offer.current = _offer;
      pc.setRemoteDescription(_offer);
    });
    _io.current.on('answer', answer => {
      setState('CONNECTED');
      pc.setRemoteDescription(answer);
    });
    _io.current.on('end', () => setState('ENDED'));
  }, []);

  const handleMakeCall = async function () {
    setState('CALLING');
    const offer = await pc.createOffer();
    pc.setLocalDescription(offer);
  };

  const handleAnswerCall = async function () {
    const _offer = offer.current;
    await pc.setRemoteDescription(_offer);
    const answer = await pc.createAnswer(_offer);
    await pc.setLocalDescription(answer);
  };

  const handleClickButton = function () {
    if (state === 'NEUTRAL') {
      handleMakeCall();
    }
    if (state === 'WAITIN_TO_ANSWER') {
      handleAnswerCall();
    }
    if (state === 'CONNECTED') {
      setState('ENDED');
      _io.current.emit('end');
    }
  };

  const button = useMemo(
    () =>
      ({
        NEUTRAL: { text: 'Make A Call', classes: 'bg-purple-600' },
        CALLING: { text: 'Calling...', classes: 'bg-green-600' },
        WAITIN_TO_ANSWER: { text: 'Answer Call', classes: 'bg-green-600' },
        CONNECTED: { text: 'End', classes: 'bg-red-600' },
      }[state]),
    [state]
  );

  const renderConnection = () => {
    if (state === 'ERROR') {
      return <div className='bg-red-600'>Unexpected Error Occured</div>;
    }
    if (state === 'ENDED') {
      return <div className='text-center'>Call Ended!</div>;
    }
    return (
      <>
        <div className='flex flex-col sm:flex-row gap-2 justify-around bg-gray-200 items-center'>
          <video
            autoPlay
            ref={userVideo}
            className='w-52 h-52 bg-gray-400 rounded-xl'
          />
          <video
            autoPlay
            ref={peerVideo}
            className='w-52 h-52 bg-gray-400 rounded-xl'
          />
        </div>
        <div className='flex flex-col items-center gap-4 my-4'>
          <button
            onClick={handleClickButton}
            disabled={state === 'CALLING'}
            className={' rounded px-3 py-2 w-40 ' + button.classes}>
            {button.text}
          </button>
        </div>
      </>
    );
  };

  return (
    <div className='mx-5 sm:mx-10 md:mx-20  p-3  bg-gray-200'>
      {renderConnection()}
    </div>
  );
}

export default App;
