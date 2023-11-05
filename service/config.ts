const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.resolve('.env') });

class Config {
  public readonly sentryDSN: string;
  public readonly whisperExecPath: string;
  public readonly whisperModelPath: string;
  public readonly directoryToStoreAudioAndTranscriptions: string;

  constructor() {
    this.sentryDSN = process.env.SENTRY_DSN || "";
    this.whisperExecPath = "./whisper.cpp/main"
    this.whisperModelPath = "./whisper.cpp/models/ggml-small.bin";
    this.directoryToStoreAudioAndTranscriptions="assets/audio-and-transcript-saved/";
  }
}

const config = new Config();

export default config;
