import { useRef, useEffect, useState } from 'react';

const useCamera = () => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setReady(true);
      }
    } catch (err) {
      setError('Camera access denied. Please allow camera permission.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setReady(false);
  };

  useEffect(() => () => stopCamera(), []);

  return { videoRef, ready, error, startCamera, stopCamera };
};

export default useCamera;