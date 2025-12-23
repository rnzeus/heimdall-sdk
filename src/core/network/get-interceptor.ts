export type XHRInterceptorModule = {
  isInterceptorEnabled: () => boolean;
  setOpenCallback: (...props: any[]) => void;
  setRequestHeaderCallback: (...props: any[]) => void;
  setSendCallback: (...props: any[]) => void;
  setHeaderReceivedCallback: (...props: any[]) => void;
  setResponseCallback: (...props: any[]) => void;
  enableInterception: () => void;
  disableInterception: () => void;
};

export function loadTryGetXHRInterceptorModule(): XHRInterceptorModule | null {
  try {
    const module = require("react-native/src/private/devsupport/devmenu/elementinspector/XHRInterceptor");
    return module.default ?? module;
  } catch {}
  try {
    const module = require("react-native/src/private/inspector/XHRInterceptor");
    return module.default ?? module;
  } catch {}
  try {
    const module = require("react-native/Libraries/Network/XHRInterceptor");
    return module.default ?? module;
  } catch {}
  return null;
}
