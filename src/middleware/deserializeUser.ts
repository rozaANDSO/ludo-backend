import { verifyJWT } from "../utils/auth/jwt.utils";


//@ts-ignore
const deserializeSocket = async (socket, next) => {
  if (socket.handshake.auth.token && socket.handshake.auth.token.refreshToken) {
    const { refreshToken } = socket.handshake.auth.token;
    if (!refreshToken) {
      return next(new Error("login first"));
    }
    const { payload } = verifyJWT(refreshToken);
    if (!payload) {

      return next(new Error("login first"));
    }
    //@ts-ignore
    //  const session = await getSession(payload.sessionId);

    // if (!session) {
    //   return next(new Error("login first"));
    // }
    // console.log("hero");
    //@ts-ignore
    socket.request.user = payload.username;
    next();
  } else {
    next(new Error("Login"));
  }
};
export default deserializeSocket;
