package com.chat.db;

import ch.qos.logback.classic.Logger;
import com.chat.tools.Tools;
import com.chat.types.CommentObj;
import com.chat.types.DiscussionObj;
import com.chat.types.UserObj;
import com.fasterxml.jackson.core.JsonProcessingException;
import org.javalite.activejdbc.LazyList;
import org.javalite.activejdbc.Model;
import org.slf4j.LoggerFactory;

import java.util.*;

import static com.chat.db.Tables.*;

/**
 * Created by tyler on 5/27/16.
 */
public class Transformations {

    public static Logger log = (Logger) LoggerFactory.getLogger(Transformations.class);

    public static Map<Long, CommentObj> convertCommentThreadedViewToMap(List<? extends Model> cvs,
                                                                        Map<Long, Integer> votes) {

        // Create a top level map of ids to comments
        Map<Long, CommentObj> commentObjMap = new LinkedHashMap<>();

        for (Model cv : cvs) {

            Long id = cv.getLong("id");

            // Check to make sure it has a vote
            Integer vote = (votes != null && votes.containsKey(id)) ? votes.get(id) : null;

            // Create the comment object
            CommentObj co = CommentObj.create(cv, vote);

            commentObjMap.put(id, co);
        }

        return commentObjMap;
    }

    public static List<CommentObj> convertCommentsMapToEmbeddedObjects(
            Map<Long, CommentObj> commentObjMap,
            Long topLimit, Long maxDepth) {

        List<CommentObj> cos = new ArrayList<>();

        for (Map.Entry<Long, CommentObj> e : commentObjMap.entrySet()) {

            Long id = e.getKey();
            CommentObj co = e.getValue();

//            log.info(co.json());

            Long parentId = commentObjMap.get(id).getParentId();

            // If its top level, add it
            if (parentId == null || id == co.getTopParentId()) {
                cos.add(co);
            }
            else {
                // Get the immediate parent
                CommentObj parent = commentObjMap.get(parentId);

                // Add it to the embedded object, if the path length/maxDepth is below a certain limit
                if (co.getPathLength() < maxDepth) {
                    parent.getEmbedded().add(co);
                    Collections.sort(parent.getEmbedded(), new CommentObj.CommentObjComparator());
                }

            }

        }

        Collections.sort(cos, new CommentObj.CommentObjComparator());

        Integer limit = (topLimit < cos.size()) ? topLimit.intValue() : cos.size();

        return cos.subList(0, limit);
    }

    public static List<CommentObj> convertCommentsToEmbeddedObjects(
            List<? extends Model> cvs,
            Map<Long, Integer> votes,
            Long topLimit, Long maxDepth) {

        Map<Long, CommentObj> commentObjMap = convertCommentThreadedViewToMap(cvs, votes);

        List<CommentObj> cos = convertCommentsMapToEmbeddedObjects(commentObjMap, topLimit, maxDepth);

        return cos;
    }

    public static List<CommentObj> convertCommentsToEmbeddedObjects(
            List<? extends Model> cvs,
            Map<Long, Integer> votes) {
        return convertCommentsToEmbeddedObjects(cvs, votes, Long.MAX_VALUE, Long.MAX_VALUE);
    }



    public static Map<Long, Integer> convertDiscussionRankToMap(Set<Long> discussionIds, UserObj userObj) {
        LazyList<DiscussionRank> drs = DiscussionRank.where(
                "discussion_id in " + Tools.convertListToInQuery(discussionIds) + " and user_id = ?",
                userObj.getId());

        // Convert those votes to a map from id to rank
        Map<Long, Integer> discussionRankMap = new HashMap<>();
        for (DiscussionRank dr : drs) {
            discussionRankMap.put(dr.getLong("discussion_id"), dr.getInteger("rank"));
        }

        try {
            log.info(Tools.JACKSON.writeValueAsString(discussionRankMap));
        } catch (JsonProcessingException e) {
            e.printStackTrace();
        }

        return discussionRankMap;
    }


}
