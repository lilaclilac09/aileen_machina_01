"use client";

type Props = {
  isAdmin: boolean;
  selectMode: boolean;
  selectedCount: number;
  uploadLocked: boolean;
  onShare: () => void;
  onUpload: () => void;
  onToggleSelect: () => void;
  onDeleteSelected: () => void;
  onAdmin: () => void;
  onToggleLock: () => void;
};

export function AlbumToolbar(props: Props) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <button type="button" className="btn-ghost !px-3 !py-2 text-xs" onClick={props.onShare}>
        分享
      </button>
      {!props.uploadLocked && (
        <button type="button" className="btn-primary !px-3 !py-2 text-xs" onClick={props.onUpload}>
          上传
        </button>
      )}
      {props.isAdmin ? (
        <>
          <button
            type="button"
            className="btn-ghost !px-3 !py-2 text-xs"
            onClick={props.onToggleSelect}
          >
            {props.selectMode ? "取消选择" : "多选"}
          </button>
          {props.selectMode && props.selectedCount > 0 && (
            <button
              type="button"
              className="btn !bg-ember !px-3 !py-2 text-xs text-paper"
              onClick={props.onDeleteSelected}
            >
              删除 ({props.selectedCount})
            </button>
          )}
          <button
            type="button"
            className="btn-ghost !px-3 !py-2 text-xs"
            onClick={props.onToggleLock}
          >
            {props.uploadLocked ? "解锁上传" : "锁定上传"}
          </button>
        </>
      ) : (
        <button type="button" className="btn-ghost !px-3 !py-2 text-xs" onClick={props.onAdmin}>
          管理
        </button>
      )}
    </div>
  );
}
