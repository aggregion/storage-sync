import {NotImplementedException} from '../exceptions';

export class FileInfo {

	/**
	 * @param  {string} path Path to the file in the container.
	 * @param  {number} size The size of file data.
	 * @param  {creationDate} creationDate The date file was uploaded.
	 * @param  {modificationDate} modificationDate The date file was changed.
	 * @return {[type]}
	 */
	constructor(path, size, creationDate, modificationDate, controlSum) {
		this.path = path;
		this.size = size;
		this.creationDate = creationDate;
		this.modificationDate = modificationDate;
	}
}

export class Container {

	constructor() {
	}

	/**
	 * Get list of all files in the container.
	 * 
	 * @return {Stream} Full list of files in the container.
	 */
	listFiles() {
		throw new NotImplementedException(`listFiles is not implemented`);
	}


	/**
	 * Get information about file.
	 * 
	 * @param  {string} filePath Path to the file in the container.
	 * @return {FileInfo} The information about given file.
	 */
	getFileInfo(filePath) {
		throw new NotImplementedException(`getFileInfo is not implemented`);
	}

	/**
	 * Returns readable stream of file data/
	 * 
	 * @param  {String} filePath Path to the file in the container.
	 * @return {Stream}          Stream of blob data.
	 */
	getReadStream(filePath) {
		throw new NotImplementedException('getReadStream is not implemented');
	}

	/**
	 * Get stream for downloading file.
	 * 
	 * @param  {string} filePath Path to the file in the container.
	 * @param {Stream} writeStream Destination stream;
	 * @return {Stream} The stream to download given file.
	 */
	copyToStream(filePath, writeStream) {
		throw new NotImplementedException(`downloadFile is not implemented`);
	}

	/**
	 * Upload file from stream.
	 * 
	 * @param  {string} filePath Path to the file in the container.
	 * @param  {stream} stream The stream from which file should be uploaded.
	 * @param  {int} fileSize The size of original data in bytes.
	 * @return {[type]}
	 */
	uploadFile(filePath, stream, fileSize) {
		throw new NotImplementedException(`uploadFile is not implemented`);
	}
}