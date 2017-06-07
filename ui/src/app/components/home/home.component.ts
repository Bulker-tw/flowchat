import { Component, OnInit, Input } from '@angular/core';
import {ToasterContainerComponent, ToasterService, ToasterConfig} from 'angular2-toaster/angular2-toaster';
import {DiscussionService, TagService, CommunityService, UserService} from '../../services';
import {Discussion, Tag, Community, Tools, User} from '../../shared';
import { Router, ActivatedRoute } from '@angular/router';

@Component({

  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  providers: []
})
export class HomeComponent implements OnInit {

  public discussions: Array<Discussion>;
  public currentCount: number = 0;
  public popularTags: Array<Tag>;
  public popularCommunities: Array<Community>;
  public sortType: string = this.userService.getUserSettings().defaultSortTypeRadioValue;
  public viewType: string = this.userService.getUserSettings().defaultViewTypeRadioValue;

  public currentPageNum: number = 1;
  public scrollDebounce: number = 0;

  public communityId: string;

  public loadingDiscussions: boolean = false;

  constructor(private toasterService: ToasterService,
    public userService: UserService,
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

    this.getDiscussions(this.communityId, this.currentPageNum, this.sortType);

    this.getPopularTags(this.sortType);
    this.getPopularCommunities(this.sortType);
  }

  resort($event) {
    console.log('resorting' + $event);
    this.sortType = $event;
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
        this.getDiscussions(this.communityId, this.currentPageNum, this.sortType);
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

  readOnboardAlert() {
    // this.userService.getUserSettings().readOnboardAlert = true;
    this.userService.saveUser().subscribe(u => {
      this.userService.setUserSettings(u.settings);
    });
  }

}
