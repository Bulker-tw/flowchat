import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import {DomSanitizationService, SafeHtml} from '@angular/platform-browser';
import {Comment} from '../../shared/comment.interface';
import {ThreadedChatService} from '../../services/threaded-chat.service';
import {UserService} from '../../services/user.service';
import { MomentPipe } from '../../pipes/moment.pipe';
import {MarkdownEditComponent} from '../markdown-edit/index';
import * as moment from 'moment';
import {MarkdownPipe} from '../../pipes/markdown.pipe';
import { Router, ROUTER_DIRECTIVES } from '@angular/router';
import {TOOLTIP_DIRECTIVES} from 'ng2-bootstrap/ng2-bootstrap';

@Component({
  moduleId: module.id,
  selector: 'app-comment',
  templateUrl: 'comment.component.html',
  styleUrls: ['comment.component.css'],
  styles: [':host >>> p { margin-bottom: .2rem; }'],
  directives: [CommentComponent, MarkdownEditComponent, ROUTER_DIRECTIVES, TOOLTIP_DIRECTIVES],
  pipes: [MomentPipe, MarkdownPipe]
})

export class CommentComponent implements OnInit {

  @Input() comment: any; // Couldn't get strict typing of this to work for recursive templates

  // This emits an event to the higher level chat component, because you only
  // want to focus on new comments when not replying
  @Output() replyingEvent = new EventEmitter();

  private replyText: string;

  private showReply: boolean = false;

  private editText: string;

  private showEdit: boolean = false;

  private collapsed: boolean = false;

  private editable: boolean = false;

  private showVoteSlider: boolean = false;

  private rank: number;

  constructor(private threadedChatService: ThreadedChatService,
    private userService: UserService) { }

  toggleShowReply() {
    this.showReply = !this.showReply;
    this.replyingEvent.emit(this.showReply);
  }

  toggleShowEdit() {
    this.showEdit = !this.showEdit;
  }

  toggleShowVoteSlider() {
    this.showVoteSlider = !this.showVoteSlider;
  }

  hideReply() {
    this.showReply = false;
    this.replyingEvent.emit(this.showReply);
  }

  hideEdit() {
    this.showEdit = false;
    this.replyingEvent.emit(this.showEdit);
  }

  // This sends the event up the chain
  setIsReplying($event) {
    this.replyingEvent.emit($event);
  }

  ngOnInit() {
    this.setEditable();
    this.setRank();
  }

  sendMessage() {
    
    this.threadedChatService.send(this.replyData());
  
    this.showReply = false;
    this.replyingEvent.emit(this.showReply);
    this.replyText = "";
  }

  deleteComment() {
    this.threadedChatService.send(this.deleteData());
  }

  editMessage() {
    this.threadedChatService.send(this.editData());
    this.showEdit = false;
    this.replyingEvent.emit(this.showEdit);
  }

  setRank() {
    if (this.comment.userRank) {
      this.rank = this.comment.userRank;
    }
  }

  updateRank($event) {
    this.rank = $event;
  }

  saveRank($event) {
    this.rank = $event;
    this.showVoteSlider = false;
    this.threadedChatService.send(this.commentRankData());
  }

  private replyData(): ReplyData {
    return {
      parentId: this.comment.id,
      reply: this.replyText
    }
  }

  private editData(): EditData {
    return {
      id: this.comment.id,
      edit: this.editText,
    }
  }

  private deleteData(): DeleteData {
    return {
      deleteId: this.comment.id
    }
  }

  private commentRankData(): CommentRankData {
    return {
      rank: this.rank,
      commentId: this.comment.id
    }

  }

  private collapseText(): string {
    return (this.collapsed) ? "[+]" : "[-]";
  }

  private isCommentNew(): boolean {
    let now = moment().subtract(2, 'minutes');
    let then = (this.comment.modified != null) ? moment(this.comment.modified) :
      moment(this.comment.created);
    return now.isBefore(then);
  }

  setReply($event) {
    this.replyText = $event;
  }

  setEdit($event) {
    this.editText = $event;
  }

  setEditable() {
    if (this.userService.getUser() != null &&
      this.comment.userId == this.userService.getUser().id) {
      this.editable = true;
    }
  }

  isDiscussionOwner() {
    if (this.userService.getUser() != null) {
      return this.comment.discussionOwnerId == this.userService.getUser().id ;
    } else {
      return false;
    }
  }
}

interface ReplyData {
  parentId: number;
  reply: string;
}

interface EditData {
  id: number;
  edit: string;
}

interface DeleteData {
  deleteId: number;
}

interface CommentRankData {
  rank: number;
  commentId: number;
}

