import ShareModal from 'lit-share-modal'
import { useState } from 'react'

type LitShareModalProps = {
  setModalOutput: (x: object) => void
}

const LitShareModal = ({ setModalOutput }: LitShareModalProps) => {
  const [openShareModal, setOpenShareModal] = useState(false);

  const onAccessControlConditionsSelected = (shareModalOutput: object) => {
    try {
      setModalOutput(shareModalOutput)
    } catch (e) {
      console.log(e)
    }
  }

  return (
    <div className={'LitShareModal'}>
      <button
        onClick={() => setOpenShareModal(true)}
      >
        Open Modal
      </button>

      <ShareModal
        onClose={() => setOpenShareModal(false)}
        showModal={openShareModal}
        onAccessControlConditionsSelected={onAccessControlConditionsSelected}
      />
    </div>

  );
}

export default LitShareModal;
