const socket = io('http://localhost:9000');
import LayoutHandler from './layoutHandler';
const layoutHandler = new LayoutHandler();
socket.on('connection', () => {});
