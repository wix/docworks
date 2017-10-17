import runJsDoc from 'docworks-jsdoc2spec';
import {saveToDir, readFromDir, merge} from 'docworks-repo';
import git from 'nodegit';

export default async function extractDocs(remoteRepo, localFolder, jsDocSources) {
  try {

    console.log(`git clone ${remoteRepo} ${localFolder}`);
    await git.Clone(remoteRepo, localFolder);

    console.log(`docworks readServices ${localFolder}`);
    let repoContent = await readFromDir(localFolder);

    console.log(`docworks extractDocs ${jsDocSources.include}/**/${jsDocSources.includePattern}`);
    let newDocs = runJsDoc(jsDocSources).services;

    console.log(`docworks merge`);
    let merged = merge(newDocs, repoContent.services);

    console.log(`docworks saveServices ${localFolder}`);
    await saveToDir(localFolder, merged.repo);

    let localRepo = await git.Repository.open(localFolder);

    console.log(`git status`);
    let statuses = await localRepo.getStatus();
    let files = statuses.filter(_ => _.isNew() || _.isModified())
      .map(_ => {
        console.log(`  ${_.isNew()?'New:     ':'Modified:'} ${_.path()}`);
        return _.path()
      });

    if (files.length > 0) {
      console.log(`git add ${files.join(' ')}`);
      let index = await localRepo.refreshIndex();
      await Promise.all(files.map(file => index.addByPath(file)));
      await index.write();
      let oid = await index.writeTree();

      console.log(`git commit -m '${merged.messages.join('\n')}'`);
      let head = await git.Reference.nameToId(localRepo, "HEAD");
      let parent = await localRepo.getCommit(head);
      var author = git.Signature.default(localRepo);
      var committer = git.Signature.default(localRepo);
      await localRepo.createCommit("HEAD", author, committer, merged.messages.join('\n'), oid, [parent]);

      console.log('git push origin master');
      let remote = await git.Remote.lookup(localRepo, 'origin');
      await remote.push(['refs/heads/master:refs/heads/master']);
    }
    else {
      console.log('no changes detected');
    }
    console.log('completed workflow');
  }
  catch (error) {
    console.log('failed to complete workflow\n', error.stack);
  }
}