import hospeaseLogo from '../../assets/hospease-logo.png';
import { cn } from '../../utils/cn';

interface Props {
  size?: number;
  className?: string;
  glow?: boolean;
  /** Show only the icon (no text) */
  iconOnly?: boolean;
}

export default function HospEaseLogo({ size = 32, className, glow }: Props) {
  return (
    <div className={cn('relative flex-shrink-0', className)}>
      {glow && (
        <div
          className="absolute -inset-1 rounded-2xl blur-md opacity-50"
          style={{ background: 'linear-gradient(135deg, #c9a227, #f0c040)' }}
        />
      )}
      <img
        src={hospeaseLogo}
        alt="HospEase"
        width={size}
        height={size}
        className="relative object-contain"
        style={{ width: size, height: size }}
      />
    </div>
  );
}
