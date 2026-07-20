class PcmCaptureProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    const processorOptions = options.processorOptions || {};
    this.targetSampleRate = processorOptions.targetSampleRate || 24000;
    this.frameMs = processorOptions.frameMs || 40;
    this.samplesPerFrame = Math.round((this.targetSampleRate * this.frameMs) / 1000);
    this.pending = new Float32Array(0);
    this.sequence = 0;
  }

  process(inputs) {
    const input = inputs[0]?.[0];
    if (!input || input.length === 0) {
      return true;
    }

    const resampled = this.resample(input, sampleRate, this.targetSampleRate);
    const combined = new Float32Array(this.pending.length + resampled.length);
    combined.set(this.pending);
    combined.set(resampled, this.pending.length);

    let offset = 0;
    while (combined.length - offset >= this.samplesPerFrame) {
      const frame = combined.slice(offset, offset + this.samplesPerFrame);
      const pcm = this.float32ToPcm16(frame);
      this.port.postMessage({ sequence: this.sequence, pcm }, [pcm.buffer]);
      this.sequence += 1;
      offset += this.samplesPerFrame;
    }

    this.pending = combined.slice(offset);
    return true;
  }

  resample(input, sourceRate, targetRate) {
    if (sourceRate === targetRate) {
      return input;
    }
    const ratio = sourceRate / targetRate;
    const outputLength = Math.max(1, Math.round(input.length / ratio));
    const output = new Float32Array(outputLength);
    for (let outputIndex = 0; outputIndex < outputLength; outputIndex += 1) {
      const sourcePosition = outputIndex * ratio;
      const leftIndex = Math.floor(sourcePosition);
      const rightIndex = Math.min(leftIndex + 1, input.length - 1);
      const fraction = sourcePosition - leftIndex;
      output[outputIndex] = input[leftIndex] * (1 - fraction) + input[rightIndex] * fraction;
    }
    return output;
  }

  float32ToPcm16(samples) {
    const pcm = new Int16Array(samples.length);
    for (let index = 0; index < samples.length; index += 1) {
      const sample = Math.max(-1, Math.min(1, samples[index]));
      pcm[index] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
    }
    return new Uint8Array(pcm.buffer);
  }
}

registerProcessor("pcm-capture-processor", PcmCaptureProcessor);
