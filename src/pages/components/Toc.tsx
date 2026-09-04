import type { DocToc } from '@/types';
import { alpha, styled } from '@mui/material/styles';
import { TreeItem } from '@mui/x-tree-view/TreeItem';

const StyledTreeItem = styled(TreeItem)(({ theme }) => ({
  group: {
    marginLeft: 7,
    paddingLeft: 18,
    borderLeft: `1px dashed ${alpha(theme.palette.text.primary, 0.4)}`,
  },
}));

const Toc = ({ toc }: { toc: DocToc }) => (
  toc.children.length > 0
    ? <StyledTreeItem itemId={toc.id} label={toc.text}>
      {
        toc.children.map((child: DocToc) => <Toc key={child.id} toc={child} />)
      }
    </StyledTreeItem>
    : <StyledTreeItem itemId={toc.id} label={toc.text} />
);

export default Toc;
