import { useTranslateRich } from '../../i18n/useTranslate';

export interface GridSelectedCountProps {
  count: number;
}

export const GridSelectedCount = (props: GridSelectedCountProps) => {
  const translateRich = useTranslateRich();
  return (
    <>
      {translateRich('velvetData.dataGrid.selected', {
        count: props.count,
        b: (children) => <b>{children}</b>,
      })}
    </>
  );
};
