window.AudioContext = window.AudioContext || window.webkitAudioContext;

function initAudio() {
        if (!navigator.getUserMedia)
            navigator.getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
        if (!navigator.cancelAnimationFrame)
            navigator.cancelAnimationFrame = navigator.webkitCancelAnimationFrame || navigator.mozCancelAnimationFrame;
        if (!navigator.requestAnimationFrame)
            navigator.requestAnimationFrame = navigator.webkitRequestAnimationFrame || navigator.mozRequestAnimationFrame;

    navigator.getUserMedia({audio:true}, gotStream, function(e) {
            alert('Error getting audio');
            console.warn(e);
        });
}

window.addEventListener('load', initAudio );

var analyserNode
var audioRecorder
var realAudioInput
var audioContext
var inputPoint

function gotStream(stream) {
  "use strict";
  audioContext = new AudioContext();
  inputPoint = audioContext.createGain();

  // Create an AudioNode from the stream.
  realAudioInput = audioContext.createMediaStreamSource(stream);
  // audioInput = realAudioInput;
  realAudioInput.connect(inputPoint);

  analyserNode = audioContext.createAnalyser();
  analyserNode.fftSize = 2048;
  inputPoint.connect( analyserNode );

  audioRecorder = new Recorder( inputPoint, {workerPath: 'js/recorderjs/recorderWorker.js'} );

  var zeroGain = audioContext.createGain();
  zeroGain.gain.value = 0.0;
  inputPoint.connect( zeroGain );
  zeroGain.connect( audioContext.destination );

  var canvas = document.getElementById("analyser");
  canvasWidth = canvas.width;
  canvasHeight = canvas.height;
  analyserContext = canvas.getContext('2d');
  updateAnalysers();
}

var analyserContext
var loopId
var canvasWidth
var canvasHeight

function updateAnalysers(time) {
  "use strict";

  var SPACING = 3;
  var BAR_WIDTH = 1;
  var numBars = Math.round(canvasWidth / SPACING);
  var freqByteData = new Uint8Array(analyserNode.frequencyBinCount);

  analyserNode.getByteFrequencyData(freqByteData); 

  analyserContext.clearRect(0, 0, canvasWidth, canvasHeight);
  analyserContext.fillStyle = '#F6D565';
  analyserContext.lineCap = 'round';
  var multiplier = analyserNode.frequencyBinCount / numBars;

  // Draw rectangle for each frequency bin.
  for (var i = 0; i < numBars; ++i) {
      var magnitude = 0;
      var offset = Math.floor( i * multiplier );
      // gotta sum/average the block, or we miss narrow-bandwidth spikes
      for (var j = 0; j< multiplier; j++)
          magnitude += freqByteData[offset + j];
      magnitude = magnitude / multiplier;
      var magnitude2 = freqByteData[i * multiplier];
      analyserContext.fillStyle = "hsl( " + Math.round((i*360)/numBars) + ", 100%, 50%)";
      analyserContext.fillRect(i * SPACING, canvasHeight, BAR_WIDTH, -magnitude);
  }

  loopId = window.requestAnimationFrame( updateAnalysers );
}
