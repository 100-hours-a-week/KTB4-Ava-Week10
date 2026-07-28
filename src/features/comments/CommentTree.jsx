import { memo } from "react";
import { DEFAULT_PROFILE_IMAGE } from "../../constants/assets";
import { formatDate } from "../../shared/lib/format";

// 부모(PostDetailPage)의 무관한 state 변경(입력창, 좋아요, dialog 등)이
// composer가 null인 동안에는 이 subtree를 다시 그리지 않도록 memo화한다.
const CommentItem = memo(function CommentItem({
  comment,
  depth,
  currentUserId,
  composer,
  onOpenReply,
  onOpenEdit,
  onDelete,
  onComposerChange,
  onComposerSubmit,
  onComposerCancel,
  busy,
}) {
  const deleted = Boolean(comment.isDeleted);
  const edited = Boolean(comment.isEdited);
  const own = !deleted && comment.userId === currentUserId;
  const active = composer?.anchorId === comment.id;
  const replies = Array.isArray(comment.comments) ? comment.comments : [];
  const canReply = !deleted && depth === 0;

  return (
    <article className={`comment-item ${depth ? "comment-item--reply" : ""}`}>
      <span className="avatar-dot">
        <img src={DEFAULT_PROFILE_IMAGE} alt="" />
      </span>
      <div className="comment-main">
        <header className="comment-header">
          <strong className="comment-author">{comment.nickname}</strong>
          <time className="comment-date" dateTime={comment.createdAt}>
            {formatDate(comment.createdAt)}
          </time>
          <div className="comment-actions">
            {canReply && (
              <button
                className="small-outline-btn"
                type="button"
                onClick={() => onOpenReply(comment, depth)}
              >
                답글
              </button>
            )}
            {own && (
              <button
                className="small-outline-btn"
                type="button"
                onClick={() => onOpenEdit(comment)}
              >
                수정
              </button>
            )}
            {own && (
              <button
                className="small-outline-btn"
                type="button"
                onClick={() => onDelete(comment)}
              >
                삭제
              </button>
            )}
          </div>
        </header>
        <p className="comment-content">{comment.content}</p>
        {edited && !deleted && <small className="comment-edited-label">수정됨</small>}
        {active && (
          <div className="reply-input-group">
            <textarea
              maxLength="500"
              value={composer.content}
              onChange={(event) => onComposerChange(event.target.value)}
              placeholder={
                composer.type === "edit"
                  ? "댓글을 수정해주세요."
                  : "답글을 남겨주세요!"
              }
              autoFocus
            />
            <div className="reply-buttons">
              <button
                className="small-outline-btn"
                type="button"
                onClick={onComposerCancel}
              >
                취소
              </button>
              <button
                className="reply-submit-btn"
                type="button"
                disabled={!composer.content.trim() || busy}
                onClick={onComposerSubmit}
              >
                {composer.type === "edit" ? "수정 저장" : "답글 등록"}
              </button>
            </div>
          </div>
        )}
        {replies.length > 0 && (
          <div className="comment-replies">
            {replies.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                depth={depth + 1}
                currentUserId={currentUserId}
                composer={composer}
                onOpenReply={onOpenReply}
                onOpenEdit={onOpenEdit}
                onDelete={onDelete}
                onComposerChange={onComposerChange}
                onComposerSubmit={onComposerSubmit}
                onComposerCancel={onComposerCancel}
                busy={busy}
              />
            ))}
          </div>
        )}
      </div>
    </article>
  );
});

export function CommentTree(props) {
  return (
    <div className="comments-list">
      {props.comments.map((comment) => (
        <CommentItem key={comment.id} comment={comment} depth={0} {...props} />
      ))}
    </div>
  );
}
