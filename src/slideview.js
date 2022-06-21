import './slideview.css';
import React from 'react';

export class Main extends React.Component {
  constructor(props) {
    super(props);
    this.state = { files: [] };
    this.updateFiles = [];
  }

  onClearFiles = () => {
    this.setState({ files: [] });
    this.updateFiles = [];
  };

  onUpdatingFiles = (dataurl, file) => {
    const _file = {
      dataurl,
      info: {
        // path: file.webkitRelativePath,
        name: file.name,
        type: file.type,
        size: file.size,
        lastModified: file.lastModified
      }
    };
    this.updateFiles.push(_file);
    this.setState({ files: this.updateFiles });
  };

  onUpdatedFiles = () => {
    console.log('files', this.state.files.length);
  };

  onUpdateWidthHeight = (index, width, height) => {
    const newFiles = this.state.files;
    newFiles[index].info.width = width;
    newFiles[index].info.height = height;
    this.setState({ files: newFiles });
  };

  render() {
    return (
      <div>
        <OpenFiles
          handleInputBegin={this.onClearFiles}
          handleLoadFile={this.onUpdatingFiles}
          handleInputEnd={this.onUpdatedFiles}
        />
        <Thmbnailer files={this.state.files} />
      </div>
    );
  }
}

function promisedSleep(timeMS) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, timeMS);
  });
}

class OpenFiles extends React.Component {
  constructor(props) {
    super(props);
    this.STATE_INIT = 0;
    this.STATE_OPENED = 1;
    this.STATE_FINISHED = 2;

    this.state = { _state: this.STATE_INIT };
    this.loadingBarRef = React.createRef();
  }

  readAsDataURL = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve(reader.result);
      };
      reader.onerror = () => {
        reject(reader.error);
      };
      reader.readAsDataURL(file);
    });
  };

  getFileLoadCallback = (file) => {
    return (e) => {
      // for each file callback
      console.log(
        // file.webkitRelativePath,
        file.name,
        file.type,
        file.size,
        file.lastModified
      );
      this.props.handleLoadFile(e.target.result, file);
    };
  };

  handleInputChange = async (e) => {
    this.setState({ _state: this.STATE_OPENED });

    // sort by filename
    const sorted = [...e.target.files].sort((a, b) => {
      if (a.name < b.name) {
        return -1;
      } else if (a.name > b.name) {
        return 1;
      } else {
        return 0;
      }
    });

    this.props.handleInputBegin();

    for (let i = 0; i < sorted.length; i++) {
      const file = sorted[i];
      // console.log(file.webkitRelativePath, file.name, file.type, file.size);
      // if (
      //   file.type !== 'image/jpeg' &&
      //   file.type !== 'image/png' &&
      //   file.type !== 'image/bmp'
      // ) {
      //   continue;
      // }

      // let fileReader = new FileReader();
      // fileReader.onload = this.getFileLoadCallback(file);
      // fileReader.readAsDataURL(file);
      const result = await this.readAsDataURL(file);
      console.log(
        // file.webkitRelativePath,
        file.name,
        file.type,
        file.size,
        file.lastModified
      );
      this.props.handleLoadFile(result, file);

      // await promisedSleep(150); // debug
      this.loadingBarRef.current.setProgress(i, e.target.files.length);
    }

    this.props.handleInputEnd();
    this.loadingBarRef.current.setProgress(1, 1);

    this.setState({ _state: this.STATE_FINISHED });
  };

  render() {
    let elem = null;
    if (this.state._state === this.STATE_INIT) {
      elem = (
        <label className="openfiles">
          Open files
          <input
            id="file"
            type="file"
            multiple
            onChange={this.handleInputChange}
            style={{ display: 'none' }}
            accept="image/jpeg, image/png, image/bmp"
          ></input>
        </label>
      );
    } else if (this.state._state === this.STATE_OPENED) {
      elem = <LoadingBar ref={this.loadingBarRef} />;
    } else {
      elem = null;
    }

    return <>{elem}</>;
  }
}

class LoadingBar extends React.Component {
  constructor(props) {
    super(props);
    this.ref = React.createRef();
  }

  setProgress = (current, total) => {
    const percentage = (current / total) * 100;
    console.log(percentage);
    this.ref.current.style.width = `${percentage}%`;
  };

  render() {
    return (
      <div className="loadingbar">
        <div ref={this.ref}></div>
      </div>
    );
  }
}

class Thmbnailer extends React.Component {
  constructor(props) {
    super(props);
    // this.handleClick = this.handleClick.bind(this);
    this.modalViewerRef = React.createRef();
  }

  handleClick = (e) => {
    console.log('clicked', e.target.id, e.target.src, e.target);
    const index = e.target.id.replace('thmbnail-img-id-', '');

    // call child functions
    const imgIndex = parseInt(index, 10);
    this.modalViewerRef.current.doVisible(imgIndex);
  };

  onCloseViewer = () => {
    console.log('close viewer');
  };

  render() {
    const thmbnailItems = this.props.files.map((file, index) => {
      const list = [];
      list.push(
        <div className="thmbnail-item" key={index}>
          <div className="thmbnail-inner" key={index}>
            <img
              id={`thmbnail-img-id-${index}`}
              className="thmbnail-img"
              key={index}
              src={file.dataurl}
              alt=""
              onClick={this.handleClick}
            />
          </div>
        </div>
      );
      return list;
    });

    return (
      <div>
        <div className="thmbnail-container">{thmbnailItems}</div>
        <ModalViewer
          handleClose={this.onCloseViewer}
          files={this.props.files}
          ref={this.modalViewerRef}
        />
      </div>
    );
  }
}

class ModalViewer extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      imageIndex: 0,
      active: 0, // 1 or 2 - imageRef_1 or imageRef_2
      playButton: 'Play',
      currentXY: { x: 0, y: 0 }
    };

    this.bgRef = React.createRef();
    this.controllerRef = React.createRef();
    this.controllerPartialRef = React.createRef();
    this.playButtonRef = React.createRef();
    this.playIntervalRef = React.createRef();
    this.imageRef_1 = React.createRef();
    this.imageRef_2 = React.createRef();

    this.playInterval = null;
    this.playIntervalOptions = [
      { value: 1, text: '1sec' },
      { value: 3, text: '3sec' },
      { value: 10, text: '10sec' },
      { value: 15, text: '15sec' },
      { value: 30, text: '30sec' },
      { value: 60, text: '1min' },
      { value: 300, text: '5min' }
    ];
  }

  componentDidMount() {
    // window.addEventListener('mousemove', this.showController);
    // window.addEventListener('mousedown', this.showController);
  }

  componentDidUnMount() {
    // window.removeEventListener('mousemove', this.showController);
    // window.removeEventListener('mousedown', this.showController);
  }

  showController = () => {
    clearTimeout(this.controllerTimeout);
    this.controllerRef.current.style.opacity = 1;
    this.controllerTimeout = setTimeout(() => {
      this.controllerRef.current.style.opacity = 0;
      this.controllerRef.current.style.transition = 'opacity 0.3s';
    }, 5000);
  };

  doVisible = (index) => {
    console.log('doVisible', index);

    window.addEventListener('mousemove', this.showController);
    window.addEventListener('mousedown', this.showController);

    this.setState({ imageIndex: index });

    this.bgRef.current.style.visibility = 'visible';
    this.bgRef.current.style.opacity = 1;
    this.bgRef.current.style.transition = 'opacity 0.3s';
    const dataurl = this.props.files[index].dataurl;

    // call child functions
    // switch
    if (this.state.active === 0 || this.state.active === 2) {
      this.imageRef_1.current.show(dataurl);
      this.imageRef_2.current.show();
      this.setState({ active: 1 });
    } else if (this.state.active === 1) {
      this.imageRef_1.current.show();
      this.imageRef_2.current.show(dataurl);
      this.setState({ active: 2 });
    }
  };

  doHidden = () => {
    console.log('doHidden');

    window.removeEventListener('mousemove', this.showController);
    window.removeEventListener('mousedown', this.showController);

    this.bgRef.current.style.opacity = 0;
    this.bgRef.current.style.transition = 'opacity 0.3s';
    setTimeout(() => {
      this.bgRef.current.style.visibility = 'hidden';
    }, 500);
  };

  handleClose = (e) => {
    this.props.handleClose(e);
    this.doHidden();
  };

  handleNext = () => {
    const index = this.state.imageIndex;
    if (this.props.files.length - 1 === index) {
      return;
    }

    const _index = index + 1;
    this.setState({ imageIndex: _index });
    const dataurl = this.props.files[_index].dataurl;

    // call child functions
    // switch
    if (this.state.active === 1) {
      this.imageRef_1.current.slideoutLeft();
      this.imageRef_2.current.slideinRight(dataurl);
      this.setState({ active: 2 });
    } else {
      this.imageRef_1.current.slideinRight(dataurl);
      this.imageRef_2.current.slideoutLeft();
      this.setState({ active: 1 });
    }
  };

  handlePrev = () => {
    const index = this.state.imageIndex;
    if (index === 0) {
      return;
    }

    const _index = index - 1;
    this.setState({ imageIndex: _index });
    const dataurl = this.props.files[_index].dataurl;

    // call child functions
    // switch
    if (this.state.active === 1) {
      this.imageRef_1.current.slideoutRight();
      this.imageRef_2.current.slideinLeft(dataurl);
      this.setState({ active: 2 });
    } else {
      this.imageRef_1.current.slideinLeft(dataurl);
      this.imageRef_2.current.slideoutRight();
      this.setState({ active: 1 });
    }
  };

  handlePlay = () => {
    if (this.playInterval === null) {
      this.playInterval = this._play();
    } else {
      this._stop(this.playInterval);
      this.playInterval = null;
    }
  };

  _play = () => {
    this.controllerPartialRef.current.style.transition = 'opacity 0.3s';
    this.controllerPartialRef.current.style.opacity = 0;
    this.playAndHiddenTimeout = setTimeout(() => {
      this.controllerPartialRef.current.style.visibility = 'hidden';
    }, 500);

    this.playButtonRef.current.classList.add('modalviewer-playing');

    this.setState({ playButton: 'Stop' });
    console.log(`play interval: ${this.playIntervalRef.current.value}`);
    const sec = parseInt(this.playIntervalRef.current.value, 10);
    return this.playWithInterval(sec * 1000);
  };

  _stop = (intervalId) => {
    clearTimeout(this.playAndHiddenTimeout);
    this.controllerPartialRef.current.style.visibility = 'visible';
    this.controllerPartialRef.current.style.opacity = 1;
    this.controllerPartialRef.current.style.transition = 'opacity 0.3s';

    this.playButtonRef.current.classList.remove('modalviewer-playing');

    this.setState({ playButton: 'Play' });
    clearInterval(intervalId);

    this.showController();
  };

  playWithInterval = (interval) => {
    return setInterval(() => {
      const index = this.state.imageIndex;
      if (this.props.files.length - 1 === index) {
        this._stop(this.playInterval);
        this.playInterval = null;
        return;
      }

      const _index = index + 1;
      this.setState({ imageIndex: _index });
      const dataurl = this.props.files[_index].dataurl;

      // call child functions
      // switch
      if (this.state.active === 1) {
        this.imageRef_1.current.fadeout();
        this.imageRef_2.current.fadein(dataurl);
        this.setState({ active: 2 });
      } else {
        this.imageRef_1.current.fadein(dataurl);
        this.imageRef_2.current.fadeout();
        this.setState({ active: 1 });
      }
    }, interval);
  };

  onUpdateImageXY = (_x, _y) => {
    this.setState({ currentXY: { x: _x, y: _y } });
  };

  render() {
    return (
      <div className="modalviewer-bg" ref={this.bgRef}>
        <div ref={this.controllerRef}>
          <div ref={this.controllerPartialRef}>
            <button
              className="modalviewer-btn modalviewer-close"
              onClick={this.handleClose}
            >
              Close
            </button>
            <button
              className="modalviewer-btn modalviewer-next"
              onClick={this.handleNext}
            >
              &gt;
            </button>
            <button
              className="modalviewer-btn modalviewer-prev"
              onClick={this.handlePrev}
            >
              &lt;
            </button>
            <select
              className="modalviewer-btn modalviewer-playinterval"
              ref={this.playIntervalRef}
              defaultValue={this.playIntervalOptions[2].value}
            >
              {this.playIntervalOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.text}
                </option>
              ))}
            </select>
            <ModalViewerPanel
              files={this.props.files}
              index={this.state.imageIndex}
              xy={this.state.currentXY}
            />
          </div>
          <button
            className="modalviewer-btn modalviewer-play"
            onClick={this.handlePlay}
            ref={this.playButtonRef}
          >
            {this.state.playButton}
          </button>
        </div>
        <ModalViewerImage
          ref={this.imageRef_1}
          handleUpdateImageXY={this.onUpdateImageXY}
        />
        <ModalViewerImage
          ref={this.imageRef_2}
          handleUpdateImageXY={this.onUpdateImageXY}
        />
      </div>
    );
  }
}

class ModalViewerPanel extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    if (
      this.props.files === undefined ||
      this.props.files === null ||
      this.props.files.length === 0
    ) {
      return null;
    } else {
      let table = [];
      const file = this.props.files[this.props.index];
      if (file === undefined || file === null) {
        return null;
      } else {
        table = Object.keys(file.info).map((key) => {
          const list = [];
          if (key === 'lastModified') {
            const d = new Date(file.info[key]);
            const value = d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
            list.push(
              <tr>
                <td>{key}</td>
                <td>{value}</td>
              </tr>
            );
          } else {
            list.push(
              <tr>
                <td>{key}</td>
                <td>{file.info[key]}</td>
              </tr>
            );
          }
          return list;
        });
      }

      return (
        <table border="1" className="modalviewer-panel">
          <tr>
            <td>current / total</td>
            <td>
              {this.props.index + 1} / {this.props.files.length}
            </td>
          </tr>
          {table}
          <tr>
            <td>width*height</td>
            <td>
              {this.props.xy.x}*{this.props.xy.y}
            </td>
          </tr>
        </table>
      );
    }
  }
}

class ModalViewerImage extends React.Component {
  constructor(props) {
    super(props);
    this.frameRef = React.createRef();
    this.imageRef = React.createRef();
    this.state = { imageDataURL: null };
    this.imageInfo = { width: 0, height: 0 };
  }

  componentDidMount() {
    window.addEventListener('resize', this.resize);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.resize);
  }

  show = (dataurl) => {
    if (dataurl) {
      this.setState({ imageDataURL: dataurl });
      this.checkImageXYSize(dataurl);
    } else {
      this.setState({ imageDataURL: null });
      this.imageRef.current.className = 'modalviewer-img-hidden';
    }
  };

  resize = () => {
    this.setImageSize(this.imageInfo.width, this.imageInfo.height);
  };

  removeClass = (name) => {
    if (this.imageRef.current.classList.contains(name)) {
      this.imageRef.current.classList.remove(name);
    }
  };

  setImageSize = (imageWidth, imageHeight) => {
    // reset
    this.removeClass('modalviewer-img-original');
    this.removeClass('modalviewer-img-fixX');
    this.removeClass('modalviewer-img-fixY');

    console.log(
      'frame_x:',
      this.frameRef.current.clientWidth,
      'frame_y:',
      this.frameRef.current.clientHeight
    );

    const qw = imageWidth / this.frameRef.current.clientWidth;
    const qh = imageHeight / this.frameRef.current.clientHeight;
    console.log('qw:', qw, 'qh:', qh);

    if (qw < 1 && qh < 1) {
      this.imageRef.current.classList.add('modalviewer-img-original');
    } else if (qw > 1 && qh < 1) {
      this.imageRef.current.classList.add('modalviewer-img-fixX');
    } else if (qw < 1 && qh > 1) {
      this.imageRef.current.classList.add('modalviewer-img-fixY');
    } else {
      if (qw > qh) {
        this.imageRef.current.classList.add('modalviewer-img-fixX');
      } else {
        this.imageRef.current.classList.add('modalviewer-img-fixY');
      }
    }
  };

  promisedLoadImage = (dataurl) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = dataurl;
      img.onload = (e) => {
        resolve(e.target);
      };
      img.onerror = () => {
        reject(new Error('load error'));
      };
    });
  };

  checkImageXYSize = async (dataurl) => {
    const r = await this.promisedLoadImage(dataurl);
    if (r instanceof Error) {
      console.log(r.toString());
      return;
    }

    console.log('img_x:', r.width, 'img_y:', r.height);
    this.imageInfo.width = r.width;
    this.imageInfo.height = r.height;

    this.props.handleUpdateImageXY(r.width, r.height);

    // reset class
    this.imageRef.current.className = '';

    this.setImageSize(r.width, r.height);
  };

  slideinRight = async (dataurl) => {
    // clearTimeout(this.timeoutRef);
    this.setState({ imageDataURL: dataurl });

    await this.checkImageXYSize(dataurl);

    // set slidein animation
    this.imageRef.current.classList.add('modalviewer-img-slidein-right');
  };

  slideinLeft = async (dataurl) => {
    //    clearTimeout(this.timeoutRef);
    this.setState({ imageDataURL: dataurl });

    await this.checkImageXYSize(dataurl);

    // set slidein animation
    this.imageRef.current.classList.add('modalviewer-img-slidein-left');
  };

  slideoutRight = () => {
    this.removeSlideinClasses();

    // set slideout animation
    this.imageRef.current.classList.add('modalviewer-img-slideout-right');
  };

  slideoutLeft = () => {
    this.removeSlideinClasses();

    // set slideout animation
    this.imageRef.current.classList.add('modalviewer-img-slideout-left');
  };

  fadein = async (dataurl) => {
    this.setState({ imageDataURL: dataurl });

    await this.checkImageXYSize(dataurl);

    // set fadein animation
    this.imageRef.current.classList.add('modalviewer-img-fadein');
  };

  fadeout = () => {
    this.removeSlideinClasses();

    // set fadeout animation
    this.imageRef.current.classList.add('modalviewer-img-fadeout');
  };

  removeSlideinClasses = () => {
    this.removeClass('modalviewer-img-slidein-left');
    this.removeClass('modalviewer-img-slidein-right');
    this.removeClass('modalviewer-img-fadein');
  };

  render() {
    return (
      <div className="modalviewer-frame" ref={this.frameRef}>
        <img src={this.state.imageDataURL} alt="" ref={this.imageRef} />
      </div>
    );
  }
}
