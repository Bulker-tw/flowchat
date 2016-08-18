import {Tag} from './tag.interface';
import {User} from './user.interface';
import {Community} from './community.interface';

export interface Discussion {
  id: number;
  creator: User;
  title: string;
  link?: string;
  text?: string;
  avgRank?: number;
  userRank?: number;
  numberOfVotes?: number;
  tags?: Array<Tag>;
  private_?: boolean;
  privateUsers?: Array<User>;
  blockedUsers?: Array<User>;
  deleted?: boolean;
  created: number;
  modified?: number;
}