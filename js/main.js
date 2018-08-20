/*
 *  Copyright (c) 2015 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */

/* global AudioContext, SoundMeter */

'use strict';

const instantMeter = document.querySelector('#instant meter');
const slowMeter = document.querySelector('#slow meter');
const clipMeter = document.querySelector('#clip meter');

const instantValueDisplay = document.querySelector('#instant .value');
const slowValueDisplay = document.querySelector('#slow .value');
const clipValueDisplay = document.querySelector('#clip .value');

try {
  window.AudioContext = window.AudioContext || window.webkitAudioContext;
  window.audioContext = new AudioContext();
} catch (e) {
  alert('Web Audio API not supported.');
}

// Put variables in global scope to make them available to the browser console.
const constraints = window.constraints = {
  audio: {channelCount: 1},
  video: false
};

var stopped = false;
var shouldStop = false;
var shouldSave = false;

var recordRTC;

var recordedChunks = [];

function stop() {
  shouldStop = true;
}

function onFinishRecord(audioURL) {
  if(shouldSave) {
    console.log(audioURL);
    var reader = new FileReader();
    reader.readAsDataURL(recordRTC.getBlob()); 
    reader.onloadend = function() {
      //console.log(reader.result)
      $.ajax({
        type: "POST",
        url: "https://speech.googleapis.com/v1p1beta1/speech:recognize?key=AIzaSyCXLjwSN8kpjr86r_NG3mj1tIhONMICEbo",
        data: JSON.stringify({
          "audio": {
            "content": reader.result.split(",")[1]
          },
          "config": {
            "enableAutomaticPunctuation": true,
            "encoding":"LINEAR16",
            "sampleRateHertz": 44100,
            "languageCode":"en-US",
            "model": "default"
          }
        }),
        success: function(data) {
          console.log(data);
        },
        contentType: "application/json",
        dataType: "json"
      });
    }
  }
  stopped = false;
  startTime = new Date().getTime();
  recordedChunks = [];
  shouldSave = false;
  shouldStop = false;
  recordRTC.getDataURL(function(dataURL) { });
  recordRTC.startRecording();
}

var mediaRecorder;

function handleSuccess(stream) {
  // Put variables in global scope to make them available to the
  // browser console.
  window.stream = stream;
  recordRTC = RecordRTC(stream, { recorderType: StereoAudioRecorder, numberOfAudioChannels: 1, type: 'audio/wav' });
  stopped = false;
  startTime = new Date().getTime();
  recordedChunks = [];
  shouldSave = false;
  shouldStop = false;
  recordRTC.startRecording();
  //recordRTC.stopRecording(onFinishRecord);
  /*const options = {mimeType: 'audio/ogg;codecs=opus'};
  mediaRecorder = new MediaRecorder(stream, options);
  mediaRecorder.ondataavailable = function(e) {
    if (e.data.size > 0) {
      recordedChunks.push(e.data);
    }

    if(shouldStop === true && stopped === false) {
      console.log("stop");
      mediaRecorder.stop();
      stopped = true;
    }
  };

  mediaRecorder.onstop = function() {
    if(shouldSave) {
      var reader = new FileReader();
      var blob = new Blob(recordedChunks, {type:'audio/ogg; codecs=opus'});
      console.log(URL.createObjectURL(blob));
      reader.readAsDataURL(blob); 
      reader.onloadend = function() {
        //console.log(reader.result)
        $.ajax({
          type: "POST",
          url: "https://speech.googleapis.com/v1p1beta1/speech:recognize?key=AIzaSyCXLjwSN8kpjr86r_NG3mj1tIhONMICEbo",
          data: JSON.stringify({
            "audio": {
              "content": reader.result.split(",")[1]
            },
            "config": {
              "enableAutomaticPunctuation": true,
              "encoding":"LINEAR16",
              "languageCode":"en-US",
              "model": "default"
            }
          }),
          success: function(data) {
            console.log(data);
          },
          contentType: "application/json",
          dataType: "json"
        });
        

        stopped = false;
        startTime = new Date().getTime();
        recordedChunks = [];
        shouldSave = false;
        shouldStop = false;
        mediaRecorder.start(100);
      }
    }
  };*/

  const soundMeter = window.soundMeter = new SoundMeter(window.audioContext);
  soundMeter.connectToSource(stream, function(e) {
    if (e) {
      alert(e);
      return;
    }
    setInterval(() => {
      instantMeter.value = instantValueDisplay.innerText =
        soundMeter.instant.toFixed(2);
      slowMeter.value = slowValueDisplay.innerText =
        soundMeter.slow.toFixed(2);
      clipMeter.value = clipValueDisplay.innerText =
        soundMeter.clip;
    }, 200);
  });

  //startTime = new Date().getTime();
  //mediaRecorder.start(100);
}

function handleError(error) {
  console.log('navigator.getUserMedia error: ', error);
}

navigator.mediaDevices.getUserMedia(constraints).then(handleSuccess).catch(handleError);
