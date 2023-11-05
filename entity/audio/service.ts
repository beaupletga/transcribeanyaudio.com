import { BusboyFileStream } from "@fastify/busboy";
import { v4 as uuidv4 } from "uuid";
import * as fs from "fs";
import {
  AudioConversionError,
  AudioExtension,
  FileTooLargeError,
  IFileMetadata,
} from "./types";
import config from "../../service/config";

const util = require("node:util");
const { pipeline } = require("node:stream");
const pump = util.promisify(pipeline);
const exec = util.promisify(require("child_process").exec);
const logger = require("pino")({ level: "info" });

const RIGHT_FORMAT_SUFFIX = "-right-format";

function getAudioFileExtension(mimetype: string): AudioExtension {
  switch (mimetype) {
    case "audio/x-wav":
      return AudioExtension.wav;
    case "audio/mp3":
      return AudioExtension.mp3;
    case "audio/mpeg":
      return AudioExtension.mpeg;
    default:
      return AudioExtension.unknown;
  }
}

async function saveAudioToDisk(
  file: BusboyFileStream,
  audioFileExtension: AudioExtension,
): Promise<IFileMetadata> {
  const nameWithoutExtension = `${uuidv4()}`;
  const name = `${nameWithoutExtension}.${audioFileExtension}`;
  const path = `${config.directoryToStoreAudioAndTranscriptions}${name}`;

  await pump(file, fs.createWriteStream(path));

  if (file.truncated) {
    throw new FileTooLargeError("File is too large");
  }

  const fileMetadata: IFileMetadata = {
    name: name,
    nameWithoutExtension,
    path,
    extension: audioFileExtension,
  };

  return fileMetadata;
}

async function transcriptAudio(fileMetadata: IFileMetadata): Promise<void> {
  const filePath = fileMetadata.path;
  const language = "en";

  const command = `${config.whisperExecPath} -m ${config.whisperModelPath} -f ${filePath} --language ${language} --output-txt`;

  await exec(command);
}

async function convertIntoTheRightFormat(
  fileMetadata: IFileMetadata,
): Promise<IFileMetadata> {
  const fileCorrectedMetadata: IFileMetadata = {
    name: `${fileMetadata.nameWithoutExtension}${RIGHT_FORMAT_SUFFIX}.${fileMetadata.extension}`,
    nameWithoutExtension: `${fileMetadata.nameWithoutExtension}${RIGHT_FORMAT_SUFFIX}`,
    path: `${config.directoryToStoreAudioAndTranscriptions}${fileMetadata.nameWithoutExtension}${RIGHT_FORMAT_SUFFIX}.${fileMetadata.extension}`,
    extension: fileMetadata.extension,
  };
  const command = `ffmpeg -i ${fileMetadata.path} -ar 16000 -ac 1 -c:a pcm_s16le ${fileCorrectedMetadata.path}`;
  logger.info({ msg: "Executing command", command });

  try {
    await exec(command);
  } catch (error) {
    throw new AudioConversionError(
      `Could not convert the file. The file has extension ${fileMetadata.extension} and could not be converted into a wav with a 16k bitrate`,
    );
  }

  return fileCorrectedMetadata;
}

async function getAudioTranscription(
  fileMetadata: IFileMetadata,
  textFilename: string,
): Promise<string> {
  const fileContent = await fs.promises.readFile(textFilename, {
    encoding: "utf-8",
  });

  return fileContent;
}

async function deleteFile(filename: string): Promise<void> {
  fs.unlink(filename, (err) => {
    if (err) {
      logger.error({ msg: `Error deleting file: ${err}` });
    } else {
      logger.info({ msg: "File deleted successfully" });
    }
  });
}

const AudioService = {
  AudioExtension,
  saveAudioToDisk,
  getAudioFileExtension,
  transcriptAudio,
  getAudioTranscription,
  convertIntoTheRightFormat,
  deleteFile,
};

export default AudioService;
