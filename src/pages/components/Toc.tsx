import { DocToc } from '@/types';
import { alpha, styled } from '@mui/material/styles';
import TreeItem from '@mui/lab/TreeItem';

const StyledTreeItem = styled(TreeItem)(({ theme }) => ({
  group: {
    marginLeft: 7,
    paddingLeft: 18,
    borderLeft: `1px dashed ${alpha(theme.palette.text.primary, 0.4)}`,
  },
}));

const Toc = ({ toc }: { toc: DocToc }) => {
  const text = decodeURIComponent(toc.text);

  return (toc.children.length > 0
    ? <StyledTreeItem nodeId={toc.id} label={text}>
      {
        toc.children.map((child: DocToc) => <Toc key={child.id} toc={child} />)
      }
    </StyledTreeItem>
    : <StyledTreeItem nodeId={toc.id} label={text} />
  );
};

export default Toc;
