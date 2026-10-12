import { useTranslate } from '../../i18n/useTranslate';
import type { ColumnManagerController } from './columnManagerController';

export interface ColumnManagerFooterProps {
  manager: ColumnManagerController;
}

export const ColumnManagerFooter = (props: ColumnManagerFooterProps) => {
  const translate = useTranslate();
  const visibleCount = () => props.manager.model.state().filter((c) => c.visible).length;
  const pinnedText = () => {
    const pinned = props.manager.model.pinnedCount();
    if (!pinned) return translate('velvetData.columnManager.nothingPinned');
    return props.manager.config.maxPinned != null
      ? translate('velvetData.columnManager.pinnedOfMax', { count: pinned, max: props.manager.config.maxPinned })
      : translate('velvetData.columnManager.pinnedCount', { count: pinned });
  };
  return (
    <div class="vui-colman__foot">
      <span>
        {translate('velvetData.columnManager.visibleCount', {
          visible: visibleCount(),
          total: props.manager.model.state().length,
        })}
      </span>
      <span>{pinnedText()}</span>
    </div>
  );
};
