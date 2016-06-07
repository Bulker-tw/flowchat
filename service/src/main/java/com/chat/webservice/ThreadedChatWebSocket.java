package com.chat.webservice;

import com.chat.db.Actions;
import com.chat.db.Transformations;
import com.chat.tools.Tools;
import com.fasterxml.jackson.core.JsonProcessingException;
import org.eclipse.jetty.websocket.api.Session;
import org.eclipse.jetty.websocket.api.annotations.OnWebSocketClose;
import org.eclipse.jetty.websocket.api.annotations.OnWebSocketConnect;
import org.eclipse.jetty.websocket.api.annotations.OnWebSocketMessage;
import org.eclipse.jetty.websocket.api.annotations.WebSocket;
import org.javalite.activejdbc.LazyList;

import java.io.IOException;
import java.sql.Array;
import java.util.*;

import static com.chat.db.Tables.*;
import static com.chat.db.Transformations.*;

/**
 * Created by tyler on 6/5/16.
 */

@WebSocket
public class ThreadedChatWebSocket {

    private String sender, msg;

    static Map<Session, Long> userMap = new HashMap<>();

    // The comment rows
    static LazyList<CommentThreadedView> comments;

    public ThreadedChatWebSocket() {
        Tools.dbInit();

        comments = fetchComments();

        Tools.dbClose();
    }


    @OnWebSocketConnect
    public void onConnect(Session user) throws Exception {

        Tools.dbInit();
        Long userId = userMap.get(user);

        if (userId == null) {
            // Create the user if necessary

            User dbUser = Actions.createUser();
            userId = dbUser.getLongId();


            userMap.put(user, userId);
        }

        // Send all data to them
        user.getRemote().sendString(convertAllDataToJson());

        // Send the updated users to everyone
        broadcastMessage(userMap.get(user), convertUsersToJson());

        Tools.dbClose();


    }

    @OnWebSocketClose
    public void onClose(Session user, int statusCode, String reason) {
        Long userId = userMap.get(user);
        userMap.remove(user);

        log.info("user " + userId + " left, " + statusCode + " " + reason);

        // Send the updated users to everyone
        broadcastMessage(userMap.get(user), convertUsersToJson());
    }

    @OnWebSocketMessage
    public void onMessage(Session user, String replyDataStr) {


        // Get the object
        Reply reply = Reply.fromJson(replyDataStr);

        // Save the data
        Tools.dbInit();

        // Collect only works on refetch
        comments = fetchComments();

        // Necessary for comment tree
        Array arr = (Array) comments.collect("breadcrumbs", "id", reply.getParentId()).get(0);

        List<Long> parentBreadCrumbs = Tools.convertArrayToList(arr);

        Comment newComment = Actions.createComment(userMap.get(user), 1L, parentBreadCrumbs, reply.getReply());

        comments = fetchComments();

        broadcastMessage(userMap.get(user), convertCommentsToJson(newComment.getLongId()));

        // TODO either fetch all the data *bad*, or just add that row to the lazylist

        Tools.dbClose();


    }

    //Sends a message from one user to all users, along with a list of current usernames
    public static void broadcastMessage(Long userId, String json) {
        userMap.keySet().stream().filter(Session::isOpen).forEach(session -> {
            try {
                session.getRemote().sendString(json);
            } catch (Exception e) {
                e.printStackTrace();
            }
        });
    }

    public static class Reply {
        private Long parentId;
        private String reply;

        public Reply(Long parentId, String reply) {
            this.parentId = parentId;
            this.reply = reply;
        }

        public Reply() {}

        public Long getParentId() {
            return parentId;
        }

        public String getReply() {
            return reply;
        }

        private static Reply fromJson(String replyDataStr) {

            try {
                return Tools.JACKSON.readValue(replyDataStr, Reply.class);
            } catch (IOException e) {
                e.printStackTrace();
            }

            return null;
        }
    }

    private static LazyList<CommentThreadedView> fetchComments() {
        return COMMENT_THREADED_VIEW.where("discussion_id = ?", 1);
    }

    public static String convertAllDataToJson() {
        return new FullData(Transformations.convertCommentsToEmbeddedObjects(comments),
                new ArrayList<>(userMap.values()),
                null).json();
    }

    public static String convertCommentsToJson(Long newCommentId) {
        return new FullData(Transformations.convertCommentsToEmbeddedObjects(comments),
                null,
                newCommentId).json();
    }

    public static String convertUsersToJson() {
        return new FullData(null,
                new ArrayList<>(userMap.values()),
                null).json();
    }



    private static class FullData {
        private List<CommentObj> comments;
        private List<Long> users;
        private Long newCommentId;

        public FullData(List<CommentObj> comments, List<Long> users, Long newCommentId) {
            this.comments = comments;
            this.users = users;
            this.newCommentId = newCommentId;
        }

        public String json() {
            try {
                return Tools.JACKSON.writeValueAsString(this);
            } catch (JsonProcessingException e) {
                e.printStackTrace();
            }
            return null;
        }

        public List<Long> getUsers() {
            return users;
        }

        public List<CommentObj> getComments() {
            return comments;
        }

        public Long getNewCommentId() {
            return newCommentId;
        }
    }


}
