package com.chat.db;

import org.javalite.activejdbc.Model;
import org.javalite.activejdbc.annotations.Table;

/**
 * Created by tyler on 5/24/16.
 */
public class Tables {

    @Table("user_")
    public static class User extends Model {}

    @Table("full_user")
    public static class FullUser extends Model {}

    @Table("user_view")
    public static class UserView extends Model {}

    @Table("login")
    public static class Login extends Model {}

    @Table("user_login_view")
    public static class UserLoginView extends Model {}

    @Table("comment")
    public static class Comment extends Model {}

    @Table("comment_tree")
    public static class CommentTree extends Model {}

    @Table("comment_breadcrumbs_view")
    public static class CommentBreadcrumbsView extends Model {}

    @Table("comment_threaded_view")
    public static class CommentThreadedView extends Model {}

    @Table("comment_rank")
    public static class CommentRank extends Model {}

    @Table("discussion_full_view")
    public static class DiscussionFullView extends Model {}

    @Table("discussion_rank")
    public static class DiscussionRank extends Model {}


}
