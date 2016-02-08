package io.hawt.git;

import java.io.File;
import java.io.IOException;

import io.hawt.util.Function;
import org.eclipse.jgit.api.errors.GitAPIException;

public interface GitFileManager {

    <T> T readFile(String branch, String pathOrEmpty, Function<File, T> callback) throws IOException, GitAPIException;

    <T> T writeFile(String branch, String pathOrEmpty, WriteCallback<T> callback) throws IOException, GitAPIException;
}
