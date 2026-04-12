class TinyEmitter {
  private events: { [key: string]: Function[] } = {};

  on(event: string, callback: Function) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
  }

  off(event: string, callback: Function) {
    if (!this.events[event]) return;
    this.events[event] = this.events[event].filter(cb => cb !== callback);
  }

  emit(event: string, ...args: any[]) {
    if (!this.events[event]) return;
    this.events[event].forEach(cb => cb(...args));
  }
}

export const authEvents = new TinyEmitter();

export const AUTH_EVENTS = {
  SESSION_EXPIRED: 'SESSION_EXPIRED',
};
