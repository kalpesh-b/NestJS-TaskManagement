import { Test } from '@nestjs/testing';
import { TasksService } from './tasks.service';
import { TaskRepository } from './task.repository';
import { GetTasksFilterDto } from './dto/get-tasks-filter.dto';
import { TaskStatus } from './task-status.enum';
import { async } from 'rxjs/internal/scheduler/async';
import { NotFoundException } from '@nestjs/common';

const mockUser = { id: 12, username: 'Test-user' };

const mockTaskRepository = () => ({
  getTasks: jest.fn(),
  findOne: jest.fn(),
  createTask: jest.fn(),
  delete: jest.fn(),
});

describe('Tasks Service', () => {
  let tasksService;
  let taskRepository;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        TasksService,
        { provide: TaskRepository, useFactory: mockTaskRepository },
      ],
    }).compile();

    tasksService = await module.get<TasksService>(TasksService);
    taskRepository = await module.get<TaskRepository>(TaskRepository);
  });

  describe('getTasks', () => {
    it('should get sll tasks', async () => {
      taskRepository.getTasks.mockResolvedValue('someValue');

      expect(taskRepository.getTasks).not.toHaveBeenCalled();
      const filters: GetTasksFilterDto = {
        status: TaskStatus.IN_PROGRESS,
        search: 'Search',
      };
      const result = await tasksService.getTasks(filters, mockUser);
      expect(taskRepository.getTasks).toHaveBeenCalled();
      expect(result).toEqual('someValue');
    });
  });

  describe('getTaskById', () => {
    it('calls taskRepository.findOne and Successfuly retrieve and return the task', async () => {
      const mockTask = {
        title: 'title',
        description: 'desc',
      };
      taskRepository.findOne.mockResolvedValue(mockTask);
      const result = await tasksService.getTaskById('1', mockUser);
      expect(result).toEqual(mockTask);
      expect(taskRepository.findOne).toHaveBeenCalledWith({
        where: {
          id: '1',
          userId: mockUser.id,
        },
      });
    });

    it('throws an error as task is not found', () => {
      taskRepository.findOne.mockResolvedValue(null);
      expect(tasksService.getTaskById(1, mockUser)).rejects.toThrow();
    });
  });

  describe('createTask', () => {
    it('create and return teh result', async () => {
      taskRepository.createTask.mockResolvedValue('someTask');
      const mockTask = {
        title: 'title',
        description: 'desc',
      };
      expect(taskRepository.createTask).not.toHaveBeenCalled();
      const result = await tasksService.createTask(mockTask, mockUser);
      expect(taskRepository.createTask).toHaveBeenCalledWith(
        mockTask,
        mockUser,
      );
      expect(result).toEqual('someTask');
    });
  });

  describe('deleteTask', () => {
    it('delete tasks on success', async () => {
      taskRepository.delete.mockResolvedValue({ affected: 1 });
      expect(taskRepository.delete).not.toHaveBeenCalled();
      const result = await tasksService.deleteTask(1, mockUser);
      expect(taskRepository.delete).toHaveBeenCalledWith({
        id: 1,
        userId: mockUser.id,
      });
    });

    it('should throw error if no task found', () => {
      taskRepository.delete.mockResolvedValue({ affected: 0 });
      expect(tasksService.deleteTask(1, mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('UpdateTaskStatus', () => {
    it('should update the task status', async () => {
      const save = jest.fn().mockResolvedValue(true);
      tasksService.getTaskById = jest.fn().mockResolvedValue({
        status: TaskStatus.OPEN,
        save,
      });

      expect(tasksService.getTaskById).not.toHaveBeenCalled();
      expect(save).not.toHaveBeenCalled();
      const result = await tasksService.updateTaskStatus(
        1,
        TaskStatus.DONE,
        mockUser,
      );

      expect(tasksService.getTaskById).toHaveBeenCalled();
      expect(save).toHaveBeenCalled();
      expect(result.status).toEqual(TaskStatus.DONE);
    });
  });
});
