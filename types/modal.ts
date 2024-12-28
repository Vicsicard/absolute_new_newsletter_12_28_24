// Modal Types
export interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface LoadingModalProps extends BaseModalProps {
  message?: string;
}

export interface ErrorModalProps extends BaseModalProps {
  error: string;
}

export interface SuccessModalProps extends BaseModalProps {
  message: string;
}
