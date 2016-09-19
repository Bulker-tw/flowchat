import { Component, OnInit, Input } from '@angular/core';
import {ToasterContainerComponent, ToasterService, ToasterConfig} from 'angular2-toaster/angular2-toaster';
import {DiscussionService, TagService, CommunityService, UserService} from '../../services';
import {Discussion, Tag, Community, Tools} from '../../shared';
import { Router, ActivatedRoute } from '@angular/router';

@Component({

  selector: 'app-home',
  templateUrl: 'home.component.html',
  styleUrls: ['home.component.scss'],
  providers: []
})
export class HomeComponent implements OnInit {

  private discussions: Array<Discussion>;
  private currentCount: number = 0;
  private popularTags: Array<Tag>;
  private popularCommunities: Array<Community>;
  private sorting: string = "time-86400";
  private viewType: string = "list";

  private currentPageNum: number = 1;
  private scrollDebounce: number = 0;

  private communityId: string;

  private loadingDiscussions: boolean = false;

  constructor(private toasterService: ToasterService,
    private userService: UserService,
    private discussionService: DiscussionService,
    private tagService: TagService,
    private communityService: CommunityService,
    private router: Router,
    private route: ActivatedRoute) { }

  popToast() {
    this.toasterService.pop('info', 'Args Title', 'Args Body');
  }

  ngOnInit() {
    console.log(this.route.snapshot.url.toString());
    console.log(this.userService.getFavoriteCommunities());
    this.communityId = this.route.snapshot.url.toString();

    if (this.userService.getFavoriteCommunities() === undefined || this.userService.getFavoriteCommunities().length == 0) {
      this.communityId = "all";
    } else if (this.communityId == "") {
      this.communityId = "favorites";
    }

    console.log(this.communityId);

    this.getDiscussions(this.communityId, this.currentPageNum, this.sorting);

    this.getPopularTags(this.sorting);
    this.getPopularCommunities(this.sorting);
  }

  resort($event) {
    console.log('resorting' + $event);
    this.sorting = $event;
    this.discussions = undefined;
    this.currentPageNum = 1;
    this.scrollDebounce = 0;
    this.ngOnInit();
  }

  onScroll(event) {

    if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight) {
      if (this.scrollDebounce == 0) {
        this.scrollDebounce = 1;
        // you're at the bottom of the page
        this.currentPageNum += 1;
        this.getDiscussions(this.communityId, this.currentPageNum, this.sorting);
        setTimeout(() => this.scrollDebounce = 0, 1000);
      }
    }
  }

  getDiscussions(communityId: string, page: number, orderBy: string) {


    if (this.discussions === undefined || this.discussions.length < this.currentCount) {

      this.loadingDiscussions = true;
      this.discussionService.getDiscussions(page, undefined, undefined, communityId, orderBy).subscribe(
        d => {
          // Append them
          if (this.discussions === undefined) {
            this.discussions = [];
          }

          this.currentCount = d.count;
          this.discussions.push(...d.discussions);
          this.loadingDiscussions = false;
        });

    } else {
      console.log("No more discussions.");
    }
  }

  getPopularTags(orderBy: string) {
    this.tagService.getPopularTags(undefined, undefined, orderBy).subscribe(
      t => {
        this.popularTags = t
      });
  }

  getPopularCommunities(orderBy: string) {
    this.communityService.getCommunities(undefined, undefined, undefined, orderBy).subscribe(
      t => {
        this.popularCommunities = t.communities
      });
  }

  removeQuotes(text: string) {
    return Tools.removeQuotes(text);
  }

  isCard(): boolean {
    return this.viewType==='card';
  }

}