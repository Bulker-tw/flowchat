package com.chat.webservice;


import ch.qos.logback.classic.Level;
import ch.qos.logback.classic.Logger;
import com.chat.db.Actions;
import com.chat.db.Transformations;
import com.chat.tools.Tools;
import com.chat.types.*;
import org.javalite.activejdbc.LazyList;
import org.javalite.activejdbc.Paginator;
import org.slf4j.LoggerFactory;

import java.util.*;

import static com.chat.db.Tables.*;
import static spark.Spark.*;

public class ChatService {

    static Logger log = (Logger) LoggerFactory.getLogger(Logger.ROOT_LOGGER_NAME);


    public static void main(String[] args) {

        log.setLevel(Level.toLevel("verbose"));
        log.getLoggerContext().getLogger("org.eclipse.jetty").setLevel(Level.OFF);
        log.getLoggerContext().getLogger("spark.webserver").setLevel(Level.OFF);

        staticFiles.externalLocation("../ui/dist");
//        staticFiles.expireTime(600);

        webSocket("/threaded_chat", ThreadedChatWebSocket.class);

        get("/test", (req, res) -> {
            return "{\"data\": [{\"message\":\"derp\"}]}";
        });

        // Get the user id
        get("/get_user", (req, res) -> {

            try {

                UserObj userObj = Actions.getOrCreateUserObj(req, res);

                return userObj.json();

            } catch (Exception e) {
                res.status(666);
                e.printStackTrace();
                return e.getMessage();
            }

        });

        get("/get_tag/:id", (req, res) -> {

            Long id = Long.valueOf(req.params(":id"));

            try {
                Tag t = Tag.findFirst("id = ?", id);

                TagObj to = TagObj.create(t);

                return to.json();

            } catch (Exception e) {
                res.status(666);
                e.printStackTrace();
                return e.getMessage();
            }

        });

        post("/login", (req, res) -> {
            try {
                log.info(req.body());

                Map<String, String> vars = Tools.createMapFromReqBody(req.body());

                String userOrEmail = vars.get("usernameOrEmail");
                String password = vars.get("password");

                UserLoginView ulv = Actions.login(userOrEmail, password, req, res);

                return ulv.toJson(false);

            } catch (Exception e) {
                res.status(666);
                e.printStackTrace();
                return e.getMessage();
            }

        });

        post("/signup", (req, res) -> {
            try {

                log.info(req.body());

                Map<String, String> vars = Tools.createMapFromReqBody(req.body());

                String userName = vars.get("username");
                String password = vars.get("password");
                String email = vars.get("email");

                UserLoginView ulv = Actions.signup(userName, password, email, req, res);

                return ulv.toJson(false);

            } catch (Exception e) {
                res.status(666);
                e.printStackTrace();
                return e.getMessage();
            }

        });

        get("/get_discussion/:id", (req, res) -> {

            try {
                Long id = Long.valueOf(req.params(":id"));
                log.info("got to discussion " + id);

                UserObj userObj = Actions.getOrCreateUserObj(req, res);

                DiscussionFullView dfv = DiscussionFullView.findFirst("id = ?", id);

                // Get your vote for the discussion:
                DiscussionRank dr = DiscussionRank.findFirst(
                        "discussion_id = ? and user_id = ?", id, userObj.getId());

                Integer vote = (dr != null) ? dr.getInteger("rank") : null;

                DiscussionObj df = DiscussionObj.create(dfv, vote);

                log.info(df.json());

                return df.json();

            } catch (Exception e) {
                res.status(666);
                e.printStackTrace();
                return e.getMessage();
            }

        });

        // Get the user id
        get("/get_discussions/:tagId/:limit/:page/:orderBy", (req, res) -> {

            try {
                Long tagId = (!req.params(":tagId").equals("all")) ? Long.valueOf(req.params(":tagId")) : null;
                Integer limit = (req.params(":limit") != null) ? Integer.valueOf(req.params(":limit")) : 10;
                Integer page = (req.params(":page") != null) ? Integer.valueOf(req.params(":page")) : 1;
                String orderBy = (req.params(":orderBy") != null) ? req.params(":orderBy") : "created desc";

                UserObj userObj = Actions.getOrCreateUserObj(req, res);

                Paginator p;

                if (tagId != null) {
                    p = new Paginator(DiscussionNoTextView.class, limit, "tag_ids @> ARRAY[?]::bigint[]", tagId).
                            orderBy(orderBy);
                } else {
                    p = new Paginator(DiscussionNoTextView.class, limit, "1=1").
                            orderBy(orderBy);
                }

                LazyList<DiscussionNoTextView> dntvs = p.getPage(page);

                // Get the list of discussions
                Set<Long> ids = dntvs.collectDistinct("id");

                // Get your votes for those discussions:
                Map<Long, Integer> discussionRankMap = Transformations.convertDiscussionRankToMap(ids, userObj);

                // Build discussion objects
                Discussions discussions = new Discussions(dntvs, discussionRankMap);

                return discussions.json();

            } catch (Exception e) {
                res.status(666);
                e.printStackTrace();
                return e.getMessage();
            }

        });

        post("/save_discussion_rank/:id/:rank", (req, res) -> {
            try {
                UserObj userObj = Actions.getOrCreateUserObj(req, res);


                Long discussionId = Long.valueOf(req.params(":id"));
                Integer rank = Integer.valueOf(req.params(":rank"));

                String message = Actions.saveDiscussionVote(userObj.getId(), discussionId, rank);
                log.info(message);

                return message;

            } catch (Exception e) {
                res.status(666);
                e.printStackTrace();
                return e.getMessage();
            }

        });

        post("/create_discussion", (req, res) -> {
            try {
                UserObj userObj = Actions.getOrCreateUserObj(req, res);

                DiscussionObj do_ = Actions.createDiscussion(userObj.getId());

                return do_.json();

            } catch (Exception e) {
                res.status(666);
                e.printStackTrace();
                return e.getMessage();
            }

        });

        post("/save_discussion", (req, res) -> {
            try {
                UserObj userObj = Actions.getOrCreateUserObj(req, res);

//                Map<String, String> m = Tools.createMapFromReqBody(req.body());

                DiscussionObj doIn = DiscussionObj.fromJson(req.body());

                DiscussionObj do_ = Actions.saveDiscussion(doIn);

                return do_.json();

            } catch (Exception e) {
                res.status(666);
                e.printStackTrace();
                return e.getMessage();
            }

        });

        get("/tag_search/:query", (req, res) -> {

            try {

                String query = req.params(":query");

                String queryStr = Tools.constructQueryString(query, "name");

                LazyList<Tag> tagRows = Tag.find(queryStr.toString()).limit(5);

                Tags tags = new Tags(tagRows);

                return tags.json();

            } catch (Exception e) {
                res.status(666);
                e.printStackTrace();
                return e.getMessage();
            }


        });


        before((req, res) -> {
            Tools.dbInit();
        });
        after((req, res) -> {
            Tools.dbClose();
            res.header("Access-Control-Allow-Origin", "*");
            res.header("Content-Encoding", "gzip");
            res.header("Access-Control-Allow-Credentials", "true");
            res.header("Access-Control-Allow-Headers", "content-type,user");

        });


        init();
    }


}
