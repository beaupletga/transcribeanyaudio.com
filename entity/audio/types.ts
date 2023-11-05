export enum AudioExtension {
  mp3 = "mp3",
  wav = "wav",
  mpeg = "mpeg",
  unknown = "unknown",
}

export interface IFileMetadata {
  name: string;
  nameWithoutExtension: string;
  path: string;
  extension: AudioExtension;
}

export class FileTooLargeError extends Error {
  message = "The file is too large";
}

export class AudioConversionError extends Error {}
