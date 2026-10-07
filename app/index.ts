import { registerRootComponent } from 'expo';
import './src/background'; // registra la tarea de segundo plano antes de montar la app
import './src/notify';
import App from './App';

registerRootComponent(App);
