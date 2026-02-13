import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from './entities/project.entity';
import { Milestone } from './entities/milestone.entity';

@Injectable()
export class ProjectsService {
    constructor(
        @InjectRepository(Project) private repo: Repository<Project>,
        @InjectRepository(Milestone) private milestoneRepo: Repository<Milestone>,
    ) { }

    async findAll(status?: string) {
        const query = this.repo.createQueryBuilder('p')
            .leftJoinAndSelect('p.manager', 'manager')
            .leftJoinAndSelect('p.milestones', 'milestones')
            .orderBy('p.created_at', 'DESC');

        if (status) {
            query.andWhere('p.status = :status', { status });
        }

        const projects = await query.getMany();
        // Calculate progress based on milestones or tasks?
        // For now, return basic info
        return projects;
    }

    async findOne(id: number) {
        const project = await this.repo.findOne({
            where: { id },
            relations: ['manager', 'milestones', 'tasks', 'tasks.assignee']
        });
        if (!project) throw new NotFoundException('Project not found');

        // Calculate stats
        // e.g. completion % based on tasks

        return project;
    }

    async create(data: any) {
        const project = this.repo.create(data);
        return this.repo.save(project);
    }

    async update(id: number, data: any) {
        await this.repo.update(id, data);
        return this.findOne(id);
    }

    async remove(id: number) {
        return this.repo.delete(id);
    }

    // Milesstones
    async addMilestone(projectId: number, data: any) {
        const ms = this.milestoneRepo.create({
            project_id: projectId,
            ...data
        });
        await this.milestoneRepo.save(ms);
        return this.findOne(projectId);
    }

    async updateMilestone(id: number, data: any) {
        await this.milestoneRepo.update(id, data);
        const ms = await this.milestoneRepo.findOne({ where: { id } });
        return this.findOne(ms.project_id);
    }

    async removeMilestone(id: number) {
        const ms = await this.milestoneRepo.findOne({ where: { id } });
        if (ms) await this.milestoneRepo.delete(id);
        return { success: true };
    }
}
