import AzureContainer from './lib/container/azure';
import StringStream from 'string-to-stream';
import async from 'async';
import fs from 'fs';

var azureCred = {
	container: 'sync-test',
	storageAccessKey: '49RbgefXwt0lPhPZQ6cw2bxzShEmjzvHnacJK0ZDgqJWMWU9Sj2+NUI953dESYMVABPGECvTOs2r/N2gPp7GnA==',
	storageAccount: 'aggregion'
};

var container = new AzureContainer(azureCred.container, azureCred.storageAccount, azureCred.storageAccessKey);

function generateTestData() {
	var blobs = [];
	for (var i = 0; i < 10; i++) {
		blobs.push(`long/path/dir${i}/file${i}.txt`);
	}
	return new Promise((resolve, reject) => {
		async.eachSeries(blobs, (item, callback) => {
			container
				.uploadFile(item, StringStream("TEST"), 4)
				.then(() => callback(null))
				.catch((err) => callback(err));
		}, (err) => {
			if (err)
				return reject(err);
			return resolve();
		});
	});
}


function handleError(error) {
	throw error;
}

generateTestData()
	.then((result) => {
		console.log('Uploaded');
		container
			.listFiles()
			.then((list) => {
				console.log(list);
				container
				.getFileInfo(list[0])
				.then((info) => {
					console.log(info);
					var stream = container.getReadStream(list[0]);
					const downloadTestFile = 'downloadTest';
					container
						.uploadFile(downloadTestFile, stream, info.size)
						.then(() => {
							container
								.getFileInfo(downloadTestFile)
								.then((newInfo) => {
									console.log(info.size, newInfo.size);
									var fileStream = fs.createwWriteStream(downloadTestFile);
									container
										.copyToStream(downloadTestFile, fileStream)
										.then(() => {
											var stats = fs.statSync(downloadTestFile);
											console.log('Stata', stats);
										})
										.catch(handleError);
								})
								.catch(handleError);
						})
						.catch(handleError);
				})
				.catch(handleError);
			})
			.catch(handleError);
	})
	.catch(handleError);

