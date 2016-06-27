package com.chat.types;


import com.chat.db.Tables;
import com.chat.tools.Tools;
import com.chat.webservice.ChatService;
import org.javalite.activejdbc.Model;

import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.Date;
import java.util.List;

/**
 * Created by tyler on 6/7/16.
 */
public class CommentObj implements JSONWriter {
    private Long id, userId, discussionId, parentId, topParentId, pathLength, numOfParents, numOfChildren;
    private String userName, text;
    private Timestamp created, modified;
    private List<CommentObj> embedded;
    private List<Long> breadcrumbs;
    private Integer avgRank, userRank, numberOfVotes;
    private Boolean deleted;

    public CommentObj(Long id,
                      Long userId,
                      String userName,
                      Long discussionId,
                      String text,
                      Long pathLength,
                      Long topParentId,
                      String breadcrumbs,
                      Long numOfParents,
                      Long numOfChildren,
                      Integer avgRank,
                      Integer userRank,
                      Integer numberOfVotes,
                      Boolean deleted,
                      Timestamp created,
                      Timestamp modified
    ) {
        this.id = id;
        this.userId = userId;
        this.userName = userName;
        this.topParentId = topParentId;
        this.text = text;
        this.discussionId = discussionId;
        this.numOfParents = numOfParents;
        this.numOfChildren = numOfChildren;
        this.avgRank = avgRank;
        this.userRank = userRank;
        this.pathLength = pathLength;
        this.created = created;
        this.modified = modified;
        this.numberOfVotes = numberOfVotes;
        this.deleted = deleted;

        this.embedded = new ArrayList<>();

        this.breadcrumbs = setBreadCrumbsArr(breadcrumbs);
        setParentId();

    }

    public static CommentObj create(Model cv, Integer vote) {
        return new CommentObj(cv.getLong("id"),
                cv.getLong("user_id"),
                cv.getString("user_name"),
                cv.getLong("discussion_id"),
                cv.getString("text_"),
                cv.getLong("path_length"),
                cv.getLong("parent_id"),
                cv.getString("breadcrumbs"),
                cv.getLong("num_of_parents"),
                cv.getLong("num_of_children"),
                cv.getInteger("avg_rank"),
                vote,
                cv.getInteger("number_of_votes"),
                cv.getBoolean("deleted"),
                cv.getTimestamp("created"),
                cv.getTimestamp("modified"));
    }


    public static List<Long> setBreadCrumbsArr(String breadCrumbs) {
        List<Long> breadcrumbs = new ArrayList<>();
        for (String br : Tools.pgArrayAggToArray(breadCrumbs)) {
            breadcrumbs.add(Long.valueOf(br));
        }
        return breadcrumbs;
    }

    private void setParentId() {
        Integer cIndex = breadcrumbs.indexOf(id);

        if (cIndex > 0) {
            parentId = breadcrumbs.get(cIndex - 1);
        }

    }


    public static CommentObj findInEmbeddedById(List<CommentObj> cos, CommentObj co) {
        Long id = co.getParentId();

        for (CommentObj c : cos) {
            if (c.getId() == id) {
                return c;
            }
        }

        return co;

    }

    public static class CommentObjComparator implements Comparator<CommentObj> {

        @Override
        public int compare(CommentObj o1, CommentObj o2) {

            Double o1R = getRank(o1);
            Double o2R = getRank(o2);

            return o2R.compareTo(o1R);
        }


        private static Double getRank(CommentObj co) {
            RankingConstantsObj rco = ChatService.rankingConstants;

            Double timeDifference= (new Date().getTime()-co.getCreated().getTime())*0.001;
            Double timeRank = rco.getCreatedWeight()/timeDifference;
            Double numberOfVotesRank = (co.getNumberOfVotes() != null) ?
                    co.getNumberOfVotes() * rco.getNumberOfVotesWeight() : 0;
            Double avgScoreRank = (co.getAvgRank() != null) ?
                    co.getAvgRank() * rco.getAvgRankWeight() : 0;
            Double rank = timeRank + numberOfVotesRank + avgScoreRank;

            return rank;

        }

    }

    public static class CommentObjComparatorOld implements Comparator<CommentObj> {

        @Override
        public int compare(CommentObj o1, CommentObj o2) {
            Integer o1R = (o1.getAvgRank() != null) ? o1.getAvgRank() : 50;
            Integer o2R = (o2.getAvgRank() != null) ? o2.getAvgRank() : 50;

            return o2R.compareTo(o1R);
        }

    }

    public Integer getAvgRank() {
        return avgRank;
    }

    public Integer getUserRank() {
        return userRank;
    }

    public Integer getNumberOfVotes() {
        return numberOfVotes;
    }

    public Long getNumOfChildren() {
        return numOfChildren;
    }

    public Long getId() {
        return id;
    }

    public Long getDiscussionId() {
        return discussionId;
    }

    public Long getParentId() {
        return parentId;
    }

    public Long getTopParentId() {
        return topParentId;
    }

    public Long getPathLength() {
        return pathLength;
    }

    public Long getNumOfParents() {
        return numOfParents;
    }

    public String getText() {
        return text;
    }

    public Timestamp getCreated() {
        return created;
    }

    public Timestamp getModified() {
        return modified;
    }

    public List<CommentObj> getEmbedded() {
        return embedded;
    }

    public List<Long> getBreadcrumbs() {
        return breadcrumbs;
    }

    public Long getUserId() { return userId; }

    public String getUserName() { return userName;}

    public Boolean getDeleted() {return deleted;}

}
