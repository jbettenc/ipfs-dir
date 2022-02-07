import './App.css';
import NewDocIcon from './assets/new_document.svg';
import { create } from 'ipfs-http-client';
import { useDropzone } from 'react-dropzone';
import { useEffect, useState } from 'react';
import * as IPFS from 'ipfs-core';

function App() {

  const [fileList, handleFileList] = useState([]);
  const [directoryUploadUrl, handleDirectoryUploadUrl] = useState('');
  const [directoryCid, handleDirectoryCid] = useState('');
  const [filename, handleFilename] = useState({
    name: '',
    ext: ''
  });
  const [directoryLoadedFiles, handleDirectoryLoadedFiles] = useState([]);
  const [ipfsNode, handleIpfsNode] = useState(null);

  useEffect(() => {
    (async () => {
      const node = await IPFS.create();
      handleIpfsNode(node);
    })();
  }, []);

  // This will be called every time our file list changes.
  // useEffect(() => {
  //   if(!fileList) {
  //     return;
  //   }

  //   fileList.forEach((file) => {
  //     console.log(file.name);
  //   });
  // }, [fileList.length, fileList]);

  // This will read the uploaded IPFS folder's children.
  useEffect(() => {
    /**
     *  NOTE: Each file returned from here will be in the following format:
     *  {
     *    depth: 1,
     *    name: 'alice.txt',
     *    path: 'QmVvjDy7yF7hdnqE8Hrf4MHo5ABDtb5AbX6hWbD3Y42bXP/alice.txt',
     *    size: 11696,
     *    cid: CID('QmZyUEQVuRK3XV7L9Dk26pg6RVSgaYkiSTEdnT2kZZdwoi'),
     *    type: 'file',
     *    mode: Number, // implicit if not provided - 0644 for files, 0755 for directories
     *    mtime?: { secs: Number, nsecs: Number }
     *  }
    **/
    (async () => {
      if(directoryCid.length > 0) {
        // const client = create({
        //   host: 'ipfs.infura.io',
        //   port: 5001,
        //   protocol: 'https',
        // });
  
        const files = []
        // Ideally, we would use ls but infura does not support it.
        for await (const file of ipfsNode.ls(directoryCid)) {
          files.push(file);
        }

        // for await (const buf of client.get(directoryCid)) {
        //   console.log(buf.length);
        // }

        handleDirectoryLoadedFiles(files);
      }
    })();
  }, [directoryCid]);

  const getFileName = (file) => {
    if(file) {
     const lastIndex = file.name.lastIndexOf('.');
     const extension = file.name.slice(lastIndex);
     const fileNameWithoutExtention = file.name.slice(0, lastIndex);
     return {
         name: fileNameWithoutExtention,
         ext: extension
     };
    } else {
        return {
          name: '',
          ext: ''
        };
    }    
 }

  const validateUploadFile = (file) => {
    if (file.type != "application/pdf") {
      alert('File not a PDF.');
    } else {
      fileList.push(file);
      let name = getFileName(file);
      // Probably good to do some name verification here (for length purposes or something).
      handleFilename(name);
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: 'application/pdf',
    validator: validateUploadFile,
  });

  const getFileUploadUrl = async () => {
    const results = await uploadMultiple();

    // At this point, we have successfully uploaded the files.
    // Update all state variables here (uploaded state, folder url, etc).

    const fileHash = results[results.length - 1].cid._baseCache.get('z');
    const fileUploadUrl = 'https://ipfs.infura.io/ipfs/' + fileHash;

    console.log("File upload directory hash: " + fileUploadUrl);
    
    // Update our directory's hash in the state
    handleDirectoryCid(fileHash);

    return fileUploadUrl;
  }

  const uploadMultiple = async () => {
    if(fileList.length == 0) {
      return;
    }

    // const client = create({
    //   host: 'ipfs.infura.io',
    //   port: 5001,
    //   protocol: 'https',
    // });

    const fileObjectArray = Array.from(fileList).map((file) => {
      return {
        path: file.name,
        content: file
      }
    });

    const results = [];
    for await (const file of ipfsNode.addAll(fileObjectArray, { wrapWithDirectory: true })) {
      results.push(file);
    }

    // console.log(results);

    return results;
  }


  return (
    <>
      <div>
        <div {...getRootProps()} className={`bg-gray-100 mx-10 md:mx-32 rounded-md focus:outline-none flex-grow border-2 border-gray-200 border-dashed my-5 py-10 flex flex-col justify-center ${isDragActive && 'bg-gray-400'} `}>
          <input {...getInputProps()} />
          <img className="select-none max-h-24" src={NewDocIcon} />
          <div className="select-none mx-auto my-3 font-medium">
            Drop a PDF Here
          </div>
        </div>
        <div className='flex'>
          <span className="mx-auto my-3 text-black-500">
            <button onClick={() => getFileUploadUrl().then((url) => handleDirectoryUploadUrl(url))} id="start-btn" className="select-none focus:outline-none text-white px-3 sm:px-5 md:px-10 py-2 rounded-md bg-orange-500 hover:bg-orange-600 font-medium">
              Upload
            </button>
          </span>
        </div>
      </div>

      <div className='flex flex-col w-full px-8'>
        {
          directoryLoadedFiles.length > 0 &&
          <>
            <div className=''>Directory contains the following files:</div>
          </>
        }
        <div className='flex flex-col'>
          {
            directoryLoadedFiles.map((fileObj) => (
              <>
                <div className='flex flex-col m-4 p-2 border'>
                  <div className='font-bold'>{fileObj.name}</div>
                  <div>{String(fileObj.cid)}</div>
                  <div>{fileObj.size} bytes</div>
                </div>
              </>
            ))
          }
        </div>
      </div>
    </>
  );
}

export default App;
