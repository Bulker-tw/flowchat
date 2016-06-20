package com.chat.webservice;


import ch.qos.logback.classic.Level;
import ch.qos.logback.classic.Logger;
import com.chat.db.Actions;
import com.chat.db.Tables;
import com.chat.db.Transformations;
import com.chat.tools.Tools;
import com.chat.types.DiscussionObj;
import org.eclipse.jetty.websocket.api.Session;
import org.javalite.activejdbc.LazyList;
import org.slf4j.LoggerFactory;

import java.text.SimpleDateFormat;
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

                UserLoginView uv = Actions.getOrCreateUserFromCookie(req, res);

                return uv.toJson(false);

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

        // Get the user id
        get("/get_discussion/:id", (req, res) -> {

            try {
                Long id = Long.valueOf(req.params(":id"));
                log.info("got to discussion " + id);

                UserLoginView uv = Actions.getOrCreateUserFromCookie(req, res);

                DiscussionFullView dfv = DiscussionFullView.findFirst("id = ?", id);

                // Get your vote for the discussion:
                DiscussionRank dr = DiscussionRank.findFirst(
                        "discussion_id = ? and user_id = ?", id, uv.getLongId());

                Integer vote = (dr != null) ? dr.getInteger("rank") : null;

                DiscussionObj df = Transformations.convertDiscussion(dfv, vote);

                log.info(df.json());

                return df.json();

            } catch (Exception e) {
                res.status(666);
                e.printStackTrace();
                return e.getMessage();
            }

        });

        post("/save_discussion_rank/:id/:rank", (req, res) -> {
            try {
                UserLoginView uv = Actions.getOrCreateUserFromCookie(req, res);

                Long discussionId = Long.valueOf(req.params(":id"));
                Integer rank = Integer.valueOf(req.params(":rank"));

                String message = Actions.saveDiscussionVote(uv.getLongId(),discussionId,rank);
                log.info(message);

                return message;

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
//            res.header("Access-Control-Allow-Headers", "User");

        });



		init();
	}




}
