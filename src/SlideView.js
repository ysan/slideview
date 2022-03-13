import './SlideView.css';
import React from 'react';

export class Main extends React.Component {
  constructor(props) {
    super(props);
    this.state = { files: [] };
  }

  onClearFiles = () => {
    this.setState({ files: [] });
  };

  onUpdatingFiles = (dataurl, file) => {
    const _file = {
      dataurl: dataurl,
      info: {
        //path: file.webkitRelativePath,
        name: file.name,
        type: file.type,
        size: file.size,
        lastModified: file.lastModified,
      },
    };
    const newFiles = this.state.files;
    newFiles.push(_file);
    this.setState({ files: newFiles });
    console.log(this.state.files.length);
  };

  onUpdatedFiles = () => {};

  onUpdateWidthHeight = (index, width, height) => {
    const newFiles = this.state.files;
    newFiles[index].info.width = width;
    newFiles[index].info.height = height;
    this.setState({ files: newFiles });
  };

  render() {
    return (
      <div>
        <DirectorySelector
          handleInputBegin={this.onClearFiles}
          handleLoadFile={this.onUpdatingFiles}
          handleInputEnd={this.onUpdatedFiles}
        />
        <Thmbnailer files={this.state.files} />
      </div>
    );
  }
}

class DirectorySelector extends React.Component {
  constructor(props) {
    super(props);
    //this.handleInputChange = this.handleInputChange.bind(this);
  }

  getFileLoadCallback = (file) => {
    return (e) => {
      // for each file callback
      console.log(
        //file.webkitRelativePath,
        file.name,
        file.type,
        file.size,
        file.lastModified
      );
      this.props.handleLoadFile(e.target.result, file);
    };
  };

  handleInputChange = (e) => {
    this.props.handleInputBegin();

    for (let i = 0; i < e.target.files.length; i++) {
      let file = e.target.files[i];
      //console.log(file.webkitRelativePath, file.name, file.type, file.size);
      if (
        file.type !== 'image/jpeg' &&
        file.type !== 'image/png' &&
        file.type !== 'image/bmp'
      ) {
        continue;
      }

      let fileReader = new FileReader();
      fileReader.onload = this.getFileLoadCallback(file);
      fileReader.readAsDataURL(file);
    }

    this.props.handleInputEnd();
  };

  render() {
    return (
      <label id="open_directory">
        open directory
        <input
          id="file"
          type="file"
          webkitdirectory="ture"
          onChange={this.handleInputChange}
          style={{ display: 'none' }}
        ></input>
      </label>
    );
  }
}

class Thmbnailer extends React.Component {
  constructor(props) {
    super(props);
    //this.handleClick = this.handleClick.bind(this);
    this.modalViewerRef = React.createRef();
  }

  handleClick = (e) => {
    console.log('clicked', e.target.id, e.target.src, e.target);
    const index = e.target.id.replace('thmbnail-img-id-', '');

    // call child functions
    const imgIndex = parseInt(index, 10);
    this.modalViewerRef.current.doVisible(imgIndex);
  };

  onCloseViewer = (e) => {
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
      playButton: 'Play',
      currentXY: { x: 0, y: 0 },
    };

    this.bgRef = React.createRef();
    this.controllerRef = React.createRef();
    this.controllerPartialRef = React.createRef();
    this.playButtonRef = React.createRef();
    this.playIntervalRef = React.createRef();
    this.imageRef_1 = React.createRef();
    this.imageRef_2 = React.createRef();

    this.active = 0; // 1 or 2 - imageRef_1 or imageRef_2
    this.playInterval = null;
    this.playIntervalOptions = [
      { value: 1, text: '1sec' },
      { value: 10, text: '10sec' },
      { value: 15, text: '15sec' },
      { value: 30, text: '30sec' },
      { value: 60, text: '1min' },
      { value: 300, text: '5min' },
    ];
  }

  componentDidMount() {
    window.addEventListener('mousemove', this.showController);
    window.addEventListener('mousedown', this.showController);
  }

  componentDidUnMount() {
    window.removeEventListener('mousemove', this.showController);
    window.removeEventListener('mousedown', this.showController);
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
    this.setState({ imageIndex: index });

    this.bgRef.current.style.visibility = 'visible';
    this.bgRef.current.style.opacity = 1;
    this.bgRef.current.style.transition = 'opacity 0.3s';
    const dataurl = this.props.files[index].dataurl;

    // call child functions
    // switch
    if (this.active === 0 || this.active === 2) {
      this.imageRef_1.current.show(dataurl);
      this.imageRef_2.current.show();
      this.active = 1;
    } else if (this.state.active === 1) {
      this.imageRef_1.current.show();
      this.imageRef_2.current.show(dataurl);
      this.active = 2;
    }
  };

  doHidden = () => {
    console.log('doHidden');
    this.bgRef.current.style.opacity = 0;
    this.bgRef.current.style.transition = 'opacity 0.3s';
    setTimeout((e) => {
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
    if (this.active === 1) {
      this.imageRef_1.current.slideoutLeft();
      this.imageRef_2.current.slideinRight(dataurl);
      this.active = 2;
    } else {
      this.imageRef_1.current.slideinRight(dataurl);
      this.imageRef_2.current.slideoutLeft();
      this.active = 1;
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
    if (this.active === 1) {
      this.imageRef_1.current.slideoutRight();
      this.imageRef_2.current.slideinLeft(dataurl);
      this.active = 2;
    } else {
      this.imageRef_1.current.slideinLeft(dataurl);
      this.imageRef_2.current.slideoutRight();
      this.active = 1;
    }
  };

  handlePlay = () => {
    if (this.playInterval == null) {
      this.playInterval = this._play();
    } else {
      this._stop(this.playInterval);
      this.playInterval = null;
    }
  };

  _play = () => {
    this.controllerPartialRef.current.style.transition = 'opacity 0.3s';
    this.controllerPartialRef.current.style.opacity = 0;
    this.playAndHiddenTimeout = setTimeout((e) => {
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
      if (this.active === 1) {
        this.imageRef_1.current.fadeout();
        this.imageRef_2.current.fadein(dataurl);
        this.active = 2;
      } else {
        this.imageRef_1.current.fadein(dataurl);
        this.imageRef_2.current.fadeout();
        this.active = 1;
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
              defaultValue={this.playIntervalOptions[1].value}
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
    if (this.props.files == null || this.props.files.length === 0) {
      return null;
    } else {
      let table = [];
      const file = this.props.files[this.props.index];
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
    this.imageRef = React.createRef();
    this.state = { imageDataURL: null };
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

  checkImageXYSize = (dataurl, callback) => {
    const img = new Image();
    img.src = dataurl;
    img.onload = (e) => {
      console.log('x:', e.target.width, 'y:', e.target.height);
      this.props.handleUpdateImageXY(e.target.width, e.target.height);

      if (e.target.width > e.target.height) {
        this.imageRef.current.className = ''; // reset
        this.imageRef.current.classList.add('modalviewer-img-fixX');
      } else {
        this.imageRef.current.className = ''; // reset
        this.imageRef.current.classList.add('modalviewer-img-fixY');
      }

      if (callback) {
        callback();
      }
    };
  };

  slideinRight = (dataurl) => {
    //    clearTimeout(this.timeoutRef);
    this.setState({ imageDataURL: dataurl });

    this.checkImageXYSize(dataurl, () => {
      // set slidein animation
      this.imageRef.current.classList.add('modalviewer-img-slidein-right');
    });
  };

  slideinLeft = (dataurl) => {
    //    clearTimeout(this.timeoutRef);
    this.setState({ imageDataURL: dataurl });

    this.checkImageXYSize(dataurl, () => {
      // set slidein animation
      this.imageRef.current.classList.add('modalviewer-img-slidein-left');
    });
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

  fadein = (dataurl) => {
    this.setState({ imageDataURL: dataurl });

    this.checkImageXYSize(dataurl, () => {
      // set fadein animation
      this.imageRef.current.classList.add('modalviewer-img-fadein');
    });
  };

  fadeout = () => {
    this.removeSlideinClasses();

    // set fadeout animation
    this.imageRef.current.classList.add('modalviewer-img-fadeout');
  };

  removeSlideinClasses = () => {
    if (
      this.imageRef.current.classList.contains('modalviewer-img-slidein-left')
    ) {
      this.imageRef.current.classList.remove('modalviewer-img-slidein-left');
    }
    if (
      this.imageRef.current.classList.contains('modalviewer-img-slidein-right')
    ) {
      this.imageRef.current.classList.remove('modalviewer-img-slidein-right');
    }
    if (this.imageRef.current.classList.contains('modalviewer-img-fadein')) {
      this.imageRef.current.classList.remove('modalviewer-img-fadein');
    }
  };

  render() {
    return (
      <div className="modalviewer-inner">
        <img src={this.state.imageDataURL} alt="" ref={this.imageRef} />
      </div>
    );
  }
}
