function ConfirmModal({ id = 'confirmModal', title = 'Confirm action', message = 'Are you sure?', onConfirm }) {
  return (
    <div className="modal fade" id={id} tabIndex="-1" aria-labelledby={`${id}Label`} aria-hidden="true">
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title" id={`${id}Label`}>{title}</h5>
            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" />
          </div>
          <div className="modal-body">{message}</div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline-secondary" data-bs-dismiss="modal">Cancel</button>
            <button type="button" className="btn btn-danger" data-bs-dismiss="modal" onClick={onConfirm}>Confirm</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;
