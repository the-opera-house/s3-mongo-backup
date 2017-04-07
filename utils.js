const {exec} = require('child_process'),
  moment = require('moment'),
  fs = require('fs'),
  Admzip = require('adm-zip');

// Zip Utilites Used to create, delete Zips
function CreateZIP(ZIP_NAME) {
  let zip = new Admzip();
  zip.addLocalFile(path.resolve(`tmp/${ZIP_NAME}`));
  zip.writeZip(path.resolve(`tmp/${ZIP_NAME}.zip`))
}

function DeleteZIP(ZIP_NAME) {
  fs.unlink(path.resolve(ZIP_NAME + ".zip"), (err) => {
    if (err) {
      console.error(`${logTime(currentTime(timezoneOffset))} ${err.message}`)
    } else {
      console.log(`${logTime(currentTime(timezoneOffset))} Deleted ${ZIP_NAME}`)
    }
  })
}

// S3 Utils Used to check if provided bucket exists If it does not exists then
// it can create one, and then use it.  Also used to upload File
function ListBuckets() {
  return new Promise((resolve, reject) => {
    S3.listBuckets((err, data) => {
      if (err) {
        return console.error(`${logTime(currentTime(timezoneOffset))} ${err}`)
      }

      let doesBucketExists = data
        .Buckets
        .find(a => a.Name === bucketName)

      if (!doesBucketExists) {
        console.log(`${logTime(currentTime(timezoneOffset))} Bucket does not exists!\n${logTime(currentTime(timezoneOffset))} Creating one now!`)
        this.CreateBucket()
      } else {

        // this.CreateBucket()
      }
    });
  });
}

function CreateBucket() {
  // console.log(this.bucketURL)
}

function UploadFile({ZIP_NAME, backupDir, bucketName, timezoneOffset}) {
  // this.bucketURL = `http://${doesBucketExists.Name}.s3.amazonaws.com`
  let fileStream = fs.createReadStream(path.resolve(`tmp/${ZIP_NAME}.zip`));

  fileStream.on('error', (err) => {
    return console.error(`${logTime(currentTime(timezoneOffset))} ${err.message}`)
  });

  let uploadParams = {
    Bucket: bucketName,
    Key: backupDir + `/mongo_${ZIP_NAME}`,
    Body: fileStream
  }

  S3.upload(uploadParams, (err, data) => {
    if (err) {
      console.error(`${logTime(currentTime(timezoneOffset))} ${err.message}`)
      // TODO: Wait and retry
      this.UploadFile()
    }

    if (data) {
      console.log(`${logTime(currentTime(timezoneOffset))}, ${data.Location}`)
    }
  })
}

function BackupMongo() {
  // Default command, does not considers username or password
  let command = `mongodump -h ${host} -d ${name} -o ${path.resolve(`tmp/${currentTime(timezoneOffset)}`)}`
  // When Username and password is provided
  if (config.mongodb.username && config.mongodb.password) {
    command = `mongodump -h ${host} -d ${name} -p ${config
      .mongodb
      .password} -u ${config
      .mongodb
      .username} -o ${path
      .resolve(`tmp/${currentTime(timezoneOffset)}`)}`
  }
  // When Username is provided
  if (config.mongodb.username && !config.mongodb.password) {
    command = `mongodump -h ${host} -d ${name} -u ${config
      .mongodb
      .username} -o ${path
      .resolve(`tmp/${currentTime(timezoneOffset)}`)}`
  }

  exec(command, (err, stdout, stderr) => {
    if (err) {
      // This error is fatal, So exit
      console.error(`${logTime(currentTime(timezoneOffset))} ${err.name}\n${logTime(currentTime(timezoneOffset))} ${err.message}`)
      process.exit(1)
    }
    if (isLoggingEnabled) {
      console.log(stdout);
      console.log(stderr);
    }
  })
}

// Gets current time If Timezoneoffset is provided, then it'll get time in that
// time zone If no timezone is provided, then it gives UTC Time
function currentTime(timezoneOffset) {
  if (timezoneOffset) {
    return moment(moment.now())
      .utcOffset(timezoneOffset, true)
      .format('YYYY-MM-DD h:mm:ss')
  } else {
    return moment
      .utc()
      .format('YYYY-MM-DD h:mm:ss');
  }
}

// Checks provided Configuration, Rejects if important keys from config are
// missing
function checkConfig(config) {
  if (config && config.mongodb && config.mongodb.host && config.mongodb.name && config.s3 && config.s3.access && config.s3.secret && config.s3.region && config.s3.accessPerm && config.s3.bucketName) {
    return true;
  }
  return false;
}

module.exports = {
  utils: {
    backup: {
      Mongo: BackupMongo
    },
    s3: {
      List: ListBuckets,
      UploadFile: UploadFile,
      CraeteBucket: CreateBucket
    },
    zip: {
      Create: CreateZIP,
      Delete: DeleteZIP
    }
  },
  checkConfig: checkConfig,
  currentTime: currentTime
}