export const BarcodeScannerUtils = {
  cameraPreloadState: {
    isPreloading: false,
    isReady: false,
    preloadedStreamId: null,
    cachedDevices: null,
    selectedCameraId: null,
  },

  loadHtml5QrcodeLibrary() {
    return new Promise((resolve, reject) => {
      if (window.Html5Qrcode) {
        resolve(window.Html5Qrcode);
        return;
      }
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href =
        "https://cdn.jsdelivr.net/npm/html5-qrcode@2.3.4/html5-qrcode.min.css";
      document.head.appendChild(link);

      const script = document.createElement("script");
      script.src =
        "https://cdn.jsdelivr.net/npm/html5-qrcode@2.3.4/html5-qrcode.min.js";

      script.onload = () => {
        if (window.Html5Qrcode) {
          resolve(window.Html5Qrcode);
        } else {
          reject(new Error("html5-qrcode library did not load properly"));
        }
      };

      script.onerror = () => {
        reject(new Error("Failed to load html5-qrcode library"));
      };

      document.body.appendChild(script);
    });
  },

  async preloadCamera() {
    if (
      this.cameraPreloadState.isPreloading ||
      this.cameraPreloadState.isReady
    ) {
      return;
    }

    this.cameraPreloadState.isPreloading = true;

    try {
      await this.loadHtml5QrcodeLibrary();

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: "environment" },
      });

      this.cameraPreloadState.preloadedStreamId = stream.id;
      stream.getTracks().forEach((track) => track.stop());

      const devices = await Html5Qrcode.getCameras();
      this.cameraPreloadState.cachedDevices = devices;

      if (devices && devices.length > 0) {
        const backCamera = devices.find((device) => {
          const label = device.label.toLowerCase();
          return (
            label.includes("back") ||
            label.includes("trasera") ||
            label.includes("rear") ||
            label.includes("environment") ||
            label.includes("0")
          );
        });

        if (backCamera) {
          this.cameraPreloadState.selectedCameraId = backCamera.id;
        } else {
          this.cameraPreloadState.selectedCameraId =
            devices[devices.length - 1].id;
        }
      }

      this.cameraPreloadState.isReady = true;
      return true;
    } catch (err) {
      this.cameraPreloadState.isReady = false;
      return false;
    } finally {
      this.cameraPreloadState.isPreloading = false;
    }
  },

  async startScanning(containerElement) {
    try {
      const Html5Qrcode = await this.loadHtml5QrcodeLibrary();

      return new Promise(async (resolve, reject) => {
        let isScanning = true;
        let scanner = null;

        const scannerId = "qr-reader-" + Date.now();
        containerElement.id = scannerId;

        const cleanup = async () => {
          isScanning = false;
          if (scanner) {
            try {
              if (scanner.isScanning) {
                await scanner.stop();
              }
              scanner.clear();
            } catch (e) {}
          }
        };

        containerElement._scannerCancel = async () => {
          await cleanup();
          resolve(null);
        };

        try {
          scanner = new Html5Qrcode(scannerId, {
            useBarkoderIfSupported: true,
            experimentalFeatures: {
              useBarCodeDetectorIfSupported: true,
            },
            verbose: false,
          });

          const qrboxFunction = (viewfinderWidth, viewfinderHeight) => {
            const minEdgePercentage = 0.7;
            const minEdgeSize = Math.min(viewfinderWidth, viewfinderHeight);
            const qrboxSize = Math.floor(minEdgeSize * minEdgePercentage);
            return {
              width: qrboxSize,
              height: qrboxSize,
            };
          };

          const config = {
            fps: 15,
            qrbox: qrboxFunction,
            aspectRatio: 1.0,
            disableFlip: false,
            videoConstraints: {
              facingMode: "environment",
              focusMode: "continuous",
            },
          };

          const qrcodeSuccessCallback = (decodedText, decodedResult) => {
            if (isScanning && decodedText) {
              cleanup().then(() => {
                resolve({ barcode: decodedText, scanner: scanner });
              });
            }
          };

          let cameraIdOrConfig = { facingMode: "environment" };
          
          if (this.cameraPreloadState.selectedCameraId) {
             cameraIdOrConfig = { deviceId: { exact: this.cameraPreloadState.selectedCameraId } };
          }

          await scanner.start(
            cameraIdOrConfig,
            config,
            qrcodeSuccessCallback,
            () => {}
          );
        } catch (err) {
          await cleanup();
          
          try {
             const devices = await Html5Qrcode.getCameras();
             if(devices && devices.length > 0) {
                 scanner = new Html5Qrcode(scannerId);
                 await scanner.start(
                    devices[0].id, 
                    { fps: 15, qrbox: 250 }, 
                    (decodedText) => {
                        cleanup().then(() => resolve({ barcode: decodedText }));
                    }, 
                    () => {}
                 );
                 return;
             }
          } catch(e) {}
          
          reject(err);
        }
      });
    } catch (err) {
      throw err;
    }
  },
};