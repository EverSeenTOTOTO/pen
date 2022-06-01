import { DocToc } from '@/types';
import {
  alpha, withStyles, Theme, createStyles,
} from '@material-ui/core/styles';
import TreeItem, { TreeItemProps } from '@material-ui/lab/TreeItem';

const StyledTreeItem = withStyles((theme: Theme) => createStyles({
  group: {
    marginLeft: 7,
    paddingLeft: 18,
    borderLeft: `1px dashed ${alpha(theme.palette.text.primary, 0.4)}`,
  },
}))((props: TreeItemProps) => <TreeItem {...props} />);

const Toc = ({ toc }: { toc: DocToc }) => {
  const handleClick = (e: React.MouseEvent) => {
    const heading = document.getElementById(toc.id);

    console.log(toc.id);

    heading?.scrollIntoView();
    e.preventDefault();
  };

  return (toc.children.length > 0
    ? <StyledTreeItem nodeId={toc.id} label={toc.text} onLabelClick={handleClick}>
    {
      toc.children.map((child: DocToc) => <Toc key={child.id} toc={child} />)
    }
  </StyledTreeItem>
    : <StyledTreeItem nodeId={toc.id} label={toc.text} onLabelClick={handleClick}/>
  );
};

export default Toc;
