import { FastifyReply } from "fastify";
import { handleError } from "../../service/error";
import { MultipartFile } from "@fastify/multipart";
import AudioService from "./service";

async function saveAudio(request, reply: FastifyReply) {
  const filesToDelelete: string[] = [];

  try {
    // do not forget to also change the nginx authorized upload size
    const options = { limits: { fileSize: 1048576 * 10 } };
    const data: MultipartFile = await request.file(options);

    const audioFileExtension = AudioService.getAudioFileExtension(
      data.mimetype,
    );

    if (audioFileExtension == AudioService.AudioExtension.unknown) {
      throw new Error(`Can not handle extension ${audioFileExtension}`);
    }

    const fileMetadata = await AudioService.saveAudioToDisk(
      data.file,
      audioFileExtension,
    );
    filesToDelelete.push(fileMetadata.path);

    const fileCorrectedMetadata =
      await AudioService.convertIntoTheRightFormat(fileMetadata);
    filesToDelelete.push(fileCorrectedMetadata.path);

    const textFilename = `${fileCorrectedMetadata.path}.txt`;
    await AudioService.transcriptAudio(fileCorrectedMetadata);
    filesToDelelete.push(textFilename);

    const transcript = await AudioService.getAudioTranscription(
      fileCorrectedMetadata,
      textFilename,
    );

    filesToDelelete.map((x) => AudioService.deleteFile(x));

    reply.code(200).send({ transcript: transcript });
  } catch (error) {
    filesToDelelete.map((x) => AudioService.deleteFile(x));
    handleError({
      request,
      reply,
      error,
      statusCode: 400,
      message: (error as Error)?.message,
    });
  }
}

const AudioController = {
  saveAudio,
};

export default AudioController;
