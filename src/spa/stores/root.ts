/* eslint-disable import/no-cycle */
import { makeAutoObservable } from 'mobx';
import SocketStore from './socket';
import BlogStore from './blog';
import UIStore from './ui';

export default class RootStore {
  socketStore: SocketStore;

  blogStore: BlogStore;

  uiStore: UIStore;

  constructor() {
    makeAutoObservable(this);
    this.socketStore = new SocketStore(this);
    this.blogStore = new BlogStore(this);
    this.uiStore = new UIStore(this);
  }
}
